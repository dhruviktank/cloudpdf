import { useState } from "react";
import FileUpload from "./common/FileUpload";
import { uploadBufferToS3 } from "../utils/s3";

export default function UploadManager({
  sessionId,
  activeFeature,
  onUploadComplete,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const documentId = await uploadBufferToS3(
        sessionId,
        file,
        file.name,
        (progress) => setUploadProgress(progress)
      );

      onUploadComplete(file, documentId);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {!isUploading && (
        <div style={{ width: "100%", textAlign: "center", marginTop: 80 }}>
            <h2>Upload a PDF</h2>
            <FileUpload
                onSelect={handleFileSelect}
                accept={activeFeature?.file || "application/pdf"}
                disabled={isUploading} />
            <p style={{ color: "#64748b", marginTop: 12 }}>
                Supported: PDF up to 10 MB
            </p>
        </div>
      )}

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
            />
          </div>

          <p style={{ marginTop: 8 }}>{uploadProgress}%</p>
        </div>
      )}
    </>
  );
}
