import React, { lazy, useEffect, useState } from "react";
import { Document, pdfjs } from "react-pdf";
import { Suspense } from "react";
import { saveUpdatedPdf } from "../../../utils/pdf.js";
const PdfPagePreview = lazy(() => import("../../common/PdfPagePreview.jsx"));

const DeletePages = ({ file }) => {
  const [numPages, setNumPages] = useState(0);
  const [pages, setPages] = useState([]);
  const [thumbs, setThumbs] = useState([]);
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

  /* Delete handler */
  const handleDelete = (pageNum) => {
    setPages((prev) => prev.filter((p) => p.number !== pageNum));
  };

  const handleSave = () => {
    const pageOrder = pages.map((p) => p.number); // remaining pages
    saveUpdatedPdf(file, pageOrder); // no rotation for delete screen
  };


  return (
    <div className="delete-wrapper">
      {!file ? (
        <div className="no-file">No PDF selected</div>
      ) : (
        <>
          <div className="header">
            <h2>Delete Pages</h2>
            <p>{file.name}</p>
          </div>

          <div className="list-container">
            <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
              <div className={isMobile ? "page-list-list" : "page-list-grid"}>
                {pages.map((page, index) => (
                  <Suspense key={page.number} fallback={<div className="thumb-loading" />}>
                    <PdfPagePreview
                      pageNumber={page.number}
                      index={index}
                      thumb={thumbs[page.number - 1]}
                      isMobile={isMobile}

                      enableDrag={false}     // ❌ No dragging
                      showDelete={true}       // ✔ Show delete button
                      showRotate={false}
                      onDelete={handleDelete}
                    />
                  </Suspense>
                ))}
              </div>
            </Document>
          </div>

          <div className="actions">
            <button className="save-btn" onClick={handleSave}>Save PDF</button>
          </div>
        </>
      )}
    </div>
  );
};

export default DeletePages;
