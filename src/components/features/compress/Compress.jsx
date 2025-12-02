import React, { useState, useRef, useEffect } from "react";
import { GlobalWorkerOptions } from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import ProgressBar from "../../common/ProgressBar";
import { getSessionId } from "../../../utils/session";
import { uploadBufferToS3 } from "../../../utils/s3";

GlobalWorkerOptions.workerSrc = pdfjsWorker;

const sessionId = getSessionId();
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://48wc3410yf.execute-api.us-east-1.amazonaws.com";

export default function CompressPdf({ file }) {
  const [status, setStatus] = useState("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const previewCanvasRef = useRef(null);
  const previewContainerRef = useRef(null);

  useEffect(() => {
    if (file) renderPreview(file);
  }, [file]);

  // -----------------------
  // Render PDF Preview
  // -----------------------
  const renderPreview = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    const canvas = previewCanvasRef.current;
    const container = previewContainerRef.current;

    const viewport = page.getViewport({ scale: 1 });

    const scale = Math.min(
      (container.clientWidth || 400) / viewport.width,
      (container.clientHeight || 500) / viewport.height
    );

    const scaled = page.getViewport({ scale });

    canvas.width = scaled.width;
    canvas.height = scaled.height;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport: scaled }).promise;
  };

  // -----------------------
  // Upload PDF to S3
  // -----------------------
  async function uploadWithProgress(data, filename) {
    return await uploadBufferToS3(
      API_BASE,
      sessionId,
      data,
      filename,
      (p) => setUploadProgress(p)
    );
  }

  // -----------------------
  // Check if original PDF already uploaded
  // -----------------------
  const checkAlreadyUploaded = async () => {
    try {
      const res = await fetch(`${API_BASE}/fetch?type=original`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId,
        },
      });

      if (res.status === 200) return true;   // File exists
      return false;                          // 404 → not uploaded
    } catch (err) {
      return false;
    }
  };

  // -----------------------
  // Compress PDF
  // -----------------------
  const compressPdf = async () => {
    if (!file) return;

    setStatus("uploading");
    setUploadProgress(0);

    try {
      const alreadyUploaded = await checkAlreadyUploaded();

      // Upload only if not uploaded before
      if (!alreadyUploaded) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        await uploadWithProgress(bytes, file.name);
      }

      // Call compress Lambda
      const compressRes = await fetch(`${API_BASE}/compress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId,
        },
      });

      const data = await compressRes.json();

      if (data.status === "success") {
        setDownloadUrl(data.output_file);
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  // -----------------------
  // Download compressed PDF
  // -----------------------
  const downloadCompressedPdf = async () => {
    try {
      const res = await fetch(`${API_BASE}/fetch?type=compressed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId,
        },
      });

      const { url } = await res.json();
      const pdfRes = await fetch(url);
      const arrayBuffer = await pdfRes.arrayBuffer();

      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const link = document.createElement("a");

      link.href = URL.createObjectURL(blob);
      link.download = "compressed.pdf";

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    }
  };

  // -----------------------
  // UI Rendering
  // -----------------------
  if (!file)
    return (
      <div className="compress-empty">
        <h3>No PDF selected</h3>
        <p>Please upload a PDF first.</p>
      </div>
    );

  return (
    <div className="compress-wrapper">

      <div ref={previewContainerRef} className="compress-preview">
        <canvas ref={previewCanvasRef} className="compress-canvas" />

        <div className="file-info">
          <div className="file-name">{file.name}</div>
          <div className="file-size">{formatSize(file.size)}</div>
        </div>
      </div>

      <div className="compress-controls">
        <button
          onClick={compressPdf}
          disabled={status === "uploading"}
          className="btn-primary"
        >
          Compress
        </button>

        {status === "uploading" && (
          <ProgressBar value={uploadProgress} label="Uploading..." />
        )}

        {status === "done" && downloadUrl && (
          <button onClick={downloadCompressedPdf} className="btn-primary">
            Download Compressed PDF
          </button>
        )}
      </div>
    </div>
  );
}

function formatSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
