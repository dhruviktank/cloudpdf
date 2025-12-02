import { useState, useEffect, lazy, Suspense } from "react";
import FileUpload from "./common/FileUpload";
import ComingSoon from "./features/ComingSoon.jsx";
import { getSessionId } from "../utils/session.js";

// Lazy-loaded feature components
const CompressPdf = lazy(() => import("./features/compress/Compress.jsx"));
const Reorder = lazy(() => import("./features/organize/Reorder.jsx"));
const Delete = lazy(() => import("./features/organize/Delete.jsx"));
const RotatePages = lazy(() => import("./features/edit/Rotate.jsx"));

const featureMap = {
  reorder: Reorder,
  "delete-pages": Delete,
  rotate: RotatePages,
  compress: CompressPdf,
};

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://48wc3410yf.execute-api.us-east-1.amazonaws.com";

export default function PdfEditor({ activeFeature }) {
  const [file, setFile] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [ActiveComponent, setActiveComponent] = useState(null);

  const sessionId = getSessionId();

  // ---------------- Update session ----------------
  async function updateSession() {
    try {
      const res = await fetch(`${API_BASE}/session/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId,
        },
        body: JSON.stringify({ sessionId, action: "initSession" }),
      });

      const data = await res.json();
      console.log("Session updated:", data);
    } catch (err) {
      console.error("Error updating session:", err);
    }
  }

  useEffect(() => {
    updateSession();
  }, [sessionId]);

  // ---------------- Update ActiveComponent ----------------
  useEffect(() => {
    if (!activeFeature) return;

    const Comp = featureMap[activeFeature.feature];
    setActiveComponent(() =>
      Comp ? Comp : () => <ComingSoon feature={activeFeature.feature} />
    );
  }, [activeFeature]);

  // ---------------- Reset ----------------
  const resetFile = () => {
    setFile(null);
    setDocumentId(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  // ---------------- File upload ----------------
  const handleFileSelect = async (selectedFile) => {
    setFile(selectedFile);
    setIsUploading(true);
    setUploadProgress(0);

    await updateSession();

    try {
      // Request presigned URL + documentId
      const res = await fetch(`${API_BASE}/document/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId,
        },
        body: JSON.stringify({
          action: "createDocument",
          filename: selectedFile.name,
        }),
      });

      if (!res.ok) throw new Error("Failed to create document");

      const { uploadUrl, documentId } = await res.json();

      // Upload to S3
      await uploadToPresigned(uploadUrl, selectedFile, (p) =>
        setUploadProgress(p)
      );

      setDocumentId(documentId);
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // ---------------- Upload to S3 via presigned URL ----------------
  function uploadToPresigned(url, file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`S3 upload failed: ${xhr.status}`));
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(file);
    });
  }

  // ---------------- Render ----------------
  return (
    <div>
      {!file ? (
        <div style={{ width: "100%", textAlign: "center", marginTop: 80 }}>
          <h2>Upload a PDF</h2>
          <FileUpload onSelect={handleFileSelect} />
          <p style={{ color: "#64748b", marginTop: 12 }}>
            Supported: PDF up to 10 MB
          </p>
        </div>
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

          {/* Upload progress bar */}
          {isUploading && (
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <h3>Uploading to Cloud…</h3>
              <div
                style={{
                  width: "60%",
                  margin: "0 auto",
                  background: "#e2e8f0",
                  borderRadius: 6,
                  height: 14,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${uploadProgress}%`,
                    height: "100%",
                    background: "#3b82f6",
                    transition: "0.2s ease",
                  }}
                ></div>
              </div>
              <p style={{ marginTop: 8 }}>{uploadProgress}%</p>
            </div>
          )}

          {/* Load editor after upload */}
          {documentId && !isUploading && (
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
    </div>
  );
}
