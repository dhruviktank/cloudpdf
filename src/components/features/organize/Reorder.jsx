import React, { useState, useEffect } from "react";
import { Document, pdfjs } from "react-pdf";
import { saveUpdatedPdf } from "../../../utils/pdf";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// COMMON COMPONENT
import PdfPagePreview from "../../common/PdfPagePreview";

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const Reorder = ({ file }) => {
  const [numPages, setNumPages] = useState(0);
  const [pages, setPages] = useState([]);
  const [thumbs, setThumbs] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  /* ------------------------- Responsive Toggle ------------------------- */
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ------------------------- PDF Load + Thumbs ------------------------- */
  const onDocumentLoadSuccess = async ({ numPages }) => {
    setNumPages(numPages);

    const initialPages = Array.from({ length: numPages }, (_, i) => ({
      id: i + 1,
      number: i + 1,
    }));
    setPages(initialPages);

    const loadingTask = pdfjs.getDocument(URL.createObjectURL(file));
    const pdf = await loadingTask.promise;

    const thumbnailList = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.28 });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page
        .render({
          canvasContext: canvas.getContext("2d"),
          viewport,
        })
        .promise;

      thumbnailList.push(canvas.toDataURL());
    }

    setThumbs(thumbnailList);
  };

  /* ------------------------- Drag & Drop Sensors ------------------------- */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // better mobile drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /* ------------------------- Handle Drag End ------------------------- */
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    setPages((old) => {
      const oldIndex = old.findIndex((i) => i.id === active.id);
      const newIndex = old.findIndex((i) => i.id === over.id);
      return arrayMove(old, oldIndex, newIndex);
    });
  };

  /* ------------------------- Reset ------------------------- */
  const resetOrder = () => {
    setPages(
      Array.from({ length: numPages }, (_, i) => ({
        id: i + 1,
        number: i + 1,
      }))
    );
  };
  const handleSave = () => {
    const pageOrder = pages.map((p) => p.number);
    saveUpdatedPdf(file, pageOrder);
  };


  return (
    <div className="reorder-wrapper">
      {!file ? (
        <div className="no-file">No PDF selected</div>
      ) : (
        <>
          <div className="header">
            <h2>Reorder Pages</h2>
            <p>{file.name}</p>
          </div>

          <div className="list-container">
            <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
              {pages.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={pages}
                    strategy={isMobile ? verticalListSortingStrategy : rectSortingStrategy}
                  >
                    <div className={isMobile ? "page-list-list" : "page-list-grid"}>
                      {pages.map((page, index) => (
                        <PdfPagePreview
                          key={page.id}
                          id={page.id}
                          pageNumber={page.number}
                          index={index}
                          thumb={thumbs[page.number - 1]}
                          isMobile={isMobile}
                          
                          /* Reorder Component Behavior */
                          enableDrag={true}
                          showDelete={false}
                          showRotate={false}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </Document>
          </div>

          <div className="actions">
            <button className="save-btn" onClick={handleSave}>Save Reordered PDF</button>
            <button className="reset-btn" onClick={resetOrder}>
              Reset Order
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Reorder;
