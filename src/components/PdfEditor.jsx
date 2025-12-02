import { useState, useEffect, lazy, Suspense } from "react";
import FileUpload from "./common/FileUpload";
import ComingSoon from "./features/ComingSoon.jsx";

import { uploadBufferToS3 } from "../utils/s3.js";
import { getSessionId } from "../utils/session.js";

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
  const [uploadedKey, setUploadedKey] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [ActiveComponent, setActiveComponent] = useState(null);

  const sessionId = getSessionId();

  // --- Update session API call ---
  async function updateSession(sessionId) {
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
      if (!res.ok) console.warn("Session update failed:", data);
    } catch (err) {
      console.error("Error updating session:", err);
    }
  }

  // --- Update session on mount ---
  useEffect(() => {
    updateSession(sessionId);
  }, [sessionId]);

  // --- Update ActiveComponent when feature changes ---
  useEffect(() => {
    if (!activeFeature) return;
    const Comp = featureMap[activeFeature.feature];
    if (Comp) setActiveComponent(() => Comp);
    else setActiveComponent(() => () => <ComingSoon feature={activeFeature.feature} />);
  }, [activeFeature]);

  // --- Reset file ---
  const resetFile = () => {
    setFile(null);
    setUploadedKey(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  // --- File upload handler ---
  const handleFileSelect = async (selectedFile) => {
    setFile(selectedFile);
    setIsUploading(true);
    setUploadProgress(0);

    await updateSession(sessionId); // update session on file select

    try {
      const uploadedKey = await uploadBufferToS3(
        API_BASE,
        sessionId,
        selectedFile,
        selectedFile.name,
        (p) => setUploadProgress(p)
      );
      setUploadedKey(uploadedKey);
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      {/* No file selected → show upload */}
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

          {/* Upload progress */}
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
                    background: "#3b82f6",
                    height: "100%",
                    transition: "0.2s ease",
                  }}
                ></div>
              </div>
              <p style={{ marginTop: 8 }}>{uploadProgress}%</p>
            </div>
          )}

          {/* After upload finished */}
          {uploadedKey && !isUploading && (
            <>
              {!ActiveComponent ? (
                <ComingSoon feature={activeFeature?.feature} />
              ) : (
                <Suspense fallback={<div style={{ padding: 50 }}>Loading...</div>}>
                  <ActiveComponent file={file} s3Key={uploadedKey} sessionId={sessionId} />
                </Suspense>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
