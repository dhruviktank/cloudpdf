import React, { useState, useEffect } from "react";
import { fetchRecentFiles } from "../utils/pdf.js";
import { FileDown, Download } from "lucide-react";
export default function RecentFiles({ sessionId, onSelectFile, compatibleFileType }) {
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingFileId, setLoadingFileId] = useState(null);

  useEffect(() => {
    async function loadRecentFiles() {
      setLoading(true);
      try {
        console.log("Fetching recent files for session:", sessionId);
        const files = await fetchRecentFiles(sessionId);
        setRecentFiles(files || []);
      } catch (err) {
        console.error("Failed to fetch recent files:", err);
        setRecentFiles([]);
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) loadRecentFiles();
  }, [sessionId]);

  const handleRecentFileClick = async (file) => {
    try {
      setLoadingFileId(file.documentId);
      const res = await fetch(
        `https://48wc3410yf.execute-api.us-east-1.amazonaws.com/document/fetch?documentId=${file.documentId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "fetchDocument", originalKey: file?.originalKey}),
        }
      );

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to get file URL");
      }

      const { url } = await res.json();
      const pdfRes = await fetch(url);
      const blob = await pdfRes.blob();

      onSelectFile(new File([blob], file.originalFileName, { type: file.originalContentType || "application/pdf" }), file.documentId);
    } catch (err) {
      alert("Failed to load file. " + err);
    } finally {
      setLoadingFileId(null);
    }
  };

  const isValidFileType = (file, expectedType) => {
    if (!file || !expectedType) return true;
    if (expectedType === "application/pdf") return file.originalFileName?.endsWith("pdf");
    if (expectedType === "image/*") return file.originalContentType?.startsWith("image/");
    return true;
  }

  if (loading) return <div className="recent-files-loading">Loading recent files…</div>;
  if (recentFiles.length === 0) return <div className="recent-files-empty">No recent files</div>;

  return (
    <div className="recent-files-container">
      <h4 className="recent-files-title">Recent Files</h4>
      <ul className="recent-files-list">
        {recentFiles.map((file) => (
          isValidFileType(file, compatibleFileType) && (
          <li
            key={file.documentId}
            className={`recent-file-item ${loadingFileId === file.documentId ? "loading" : ""}`}
            onClick={() => handleRecentFileClick(file)}
          >
            <div className="file-icon"><FileDown /></div>
            <div className="file-info">
              <span className="file-name">{file.originalFileName}</span>
              {loadingFileId === file.documentId && <span className="loading-spinner"><Download /></span>}
            </div>
          </li>
          )
        ))}
      </ul>
    </div>
  );
}
