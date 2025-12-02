import React, { useEffect, useState } from "react";
import { Document, pdfjs } from "react-pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { saveUpdatedPdf } from "../../../utils/pdf";
import PdfPagePreview from "../../common/PdfPagePreview";

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const RotatePages = ({ file }) => {
    const [numPages, setNumPages] = useState(0);
    const [pages, setPages] = useState([]);
    const [thumbs, setThumbs] = useState([]);
    const [rotations, setRotations] = useState({});
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    /* Responsive toggle */
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    /* Load PDF + generate thumbnails */
    const onDocumentLoadSuccess = async ({ numPages }) => {
        setNumPages(numPages);

        const initial = Array.from({ length: numPages }, (_, i) => ({
            number: i + 1,
        }));
        setPages(initial);

        const loadingTask = pdfjs.getDocument(URL.createObjectURL(file));
        const pdf = await loadingTask.promise;

        const thumbList = [];

        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.28 });

            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;

            thumbList.push(canvas.toDataURL());
        }

        setThumbs(thumbList);
    };

    /* Rotate handler */
    const handleRotate = (pageNum) => {
        setRotations((prev) => ({
            ...prev,
            [pageNum]: ((prev[pageNum] || 0) + 90) % 360,
        }));
    };
    const handleSave = () => {
        const pageOrder = pages.map((p) => p.number);

        const rotationMap = {};
        pages.forEach((p) => {
            rotationMap[p.number] = rotations[p.number] || 0;
        });

        saveUpdatedPdf(file, pageOrder, rotationMap);
    };


    return (
        <div className="rotate-wrapper">
            {!file ? (
                <div className="no-file">No PDF selected</div>
            ) : (
                <>
                    <div className="header">
                        <h2>Rotate Pages</h2>
                        <p>{file.name}</p>
                    </div>

                    <div className="list-container">
                        <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
                            <div className={isMobile ? "page-list-list" : "page-list-grid"}>
                                {pages.map((page, index) => (
                                    <PdfPagePreview
                                        key={page.number}
                                        pageNumber={page.number}
                                        index={index}
                                        thumb={thumbs[page.number - 1]}
                                        isMobile={isMobile}
                                        enableDrag={false}
                                        showDelete={false}
                                        showRotate={true}    // ✔ Show rotate icon
                                        onRotate={handleRotate}
                                        rotation={rotations[page.number] || 0}
                                    />
                                ))}
                            </div>
                        </Document>
                    </div>

                    <div className="actions">
                        <button className="save-btn" onClick={handleSave}>Save Rotated PDF</button>
                    </div>
                </>
            )}
        </div>
    );
};

export default RotatePages;
