import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontal, Trash, RotateCw } from "lucide-react";

const PdfPagePreview = ({
    id,
    pageNumber,
    thumb,
    index,
    isMobile,
    enableDrag = false,
    showDelete = false,
    showRotate = false,
    onDelete,
    onRotate,
    rotation = 0,
}) => {
    let attributes = {};
    let listeners = {};
    let setNodeRef = () => { };
    let style = {};

    /* -------- ENABLE SORTABLE ONLY IF enableDrag=true ---------- */
    if (enableDrag) {
        const sortable = useSortable({ id });

        attributes = sortable.attributes;
        listeners = sortable.listeners;
        setNodeRef = sortable.setNodeRef;

        style = {
            transform: CSS.Transform.toString(sortable.transform),
            transition: sortable.transition,
            zIndex: sortable.isDragging ? 3 : 1,
            touchAction: "pan-y",
        };
    }

    return (
        <div
            ref={enableDrag ? setNodeRef : null}
            style={enableDrag ? style : {}}
            className={`page-row ${enableDrag && style?.zIndex === 3 ? "dragging" : ""}`}
        >

            {/* Drag Handle */}
            {enableDrag && (
                <div className="drag-handle" 
                style={{ touchAction: "none" }}
                {...attributes} {...listeners}>
                    <GripHorizontal />
                </div>
            )}

            {/* Thumbnail */}
            <img
                src={thumb}
                alt={`page-${pageNumber}`}
                className="thumb"
                style={{
                    transform: `rotate(${rotation || 0}deg)`,
                    transition: "0.3s",
                }}
            />


            {/* Page Label */}
            <div className="page-info">
                <span className="tag">Page {index + 1}</span>
            </div>

            {/* Actions */}
            <div className="page-actions">
                {showRotate && (
                    <button className="icon-btn" onClick={() => onRotate?.(pageNumber)}>
                        <RotateCw />
                    </button>
                )}

                {showDelete && (
                    <button className="icon-btn delete" onClick={() => onDelete?.(pageNumber)}>
                        <Trash />
                    </button>
                )}
            </div>
        </div>
    );
};

export default PdfPagePreview;
