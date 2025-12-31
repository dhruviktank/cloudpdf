import { useState, useEffect, lazy, Suspense } from "react";
import ComingSoon from "./features/ComingSoon.jsx";
import RecentFiles from "./RecentFile.jsx";
import { getSessionId } from "../utils/session.js";
import { updateSession } from "../utils/session.js";
import UploadManager from "./UploadManager.jsx";

const CompressPdf = lazy(() => import("./features/compress/Compress.jsx"));
const Reorder = lazy(() => import("./features/organize/Reorder.jsx"));
const Delete = lazy(() => import("./features/organize/Delete.jsx"));
const RotatePages = lazy(() => import("./features/edit/Rotate.jsx"));
const ImgToPdf = lazy(() => import("./features/convert/Imgtopdf.jsx"));

const featureMap = {
  reorder: Reorder,
  "delete-pages": Delete,
  rotate: RotatePages,
  compress: CompressPdf,
  "image-pdf": ImgToPdf,
};
export default function PdfEditor({ activeFeature }) {
  const [file, setFile] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const ActiveComponent =
    activeFeature && featureMap[activeFeature.id]
      ? featureMap[activeFeature.id]
      : ComingSoon;
  const sessionId = getSessionId();

  useEffect(() => {
    updateSession(sessionId);
  }, [sessionId]);

  useEffect(() => {
    if (!activeFeature) return;
    if (!isValidFileType(file, activeFeature.file)) {
      resetFile();
    }
  }, [activeFeature]);

  const resetFile = () => {
    setFile(null);
    setDocumentId(null);
  };

  const isValidFileType = (file, expectedType) => {
    if (!file || !expectedType) return true;
    if (expectedType === "application/pdf") return file.type === "application/pdf";
    if (expectedType === "image/*") return file.type.startsWith("image/");
    return true;
  }

  // ---------------- Render ----------------
  return (
    <div>
      {!file ? (
          <UploadManager
            sessionId={sessionId}
            activeFeature={activeFeature}
            onUploadComplete={(file, documentId) => {
              setFile(file);
              setDocumentId(documentId);
            }}
          />
      ) : (
        <>
          {/* Reset button */}
          <div style={{ textAlign: "right", margin: "10px 20px 0 0" }}>
            <button
              onClick={resetFile}
              className="btn-secondary"
              style={{
                background: "#e11d48",
                color: "#fff",
                padding: "8px 16px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Reset File
            </button>
          </div>
          {file && (
            <Suspense fallback={<div style={{ padding: 50 }}>Loading...</div>}>
              <ActiveComponent
                file={file}
                documentId={documentId}
                sessionId={sessionId}
              />
            </Suspense>
          )}
        </>
      )}
      <RecentFiles
        sessionId={sessionId}
        onSelectFile={(selectedFile, documentId) => {
          setFile(selectedFile);
          setDocumentId(documentId);
        }}
        compatibleFileType={activeFeature.file}
      />
    </div>
  );
}
