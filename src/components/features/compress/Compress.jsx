import React, { useState, useRef, useEffect } from "react";
import { GlobalWorkerOptions } from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import ProgressBar from "../../common/ProgressBar";

GlobalWorkerOptions.workerSrc = pdfjsWorker;

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://48wc3410yf.execute-api.us-east-1.amazonaws.com";

export default function CompressPdf({ file, documentId }) {
  const [status, setStatus] = useState("idle");
  const [downloadUrl, setDownloadUrl] = useState(null);

  const previewCanvasRef = useRef(null);
  const previewContainerRef = useRef(null);

  useEffect(() => {
    if (file && file.type == 'application/pdf') renderPreview(file);
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
  // Call compress Lambda
  // -----------------------
  const compressPdf = async () => {
    if (!documentId) {
      alert("Missing documentId");
      return;
    }

    setStatus("processing");

    try {
      const compressRes = await fetch(`${API_BASE}/compress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
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
  // Download compressed file
  // -----------------------
  const downloadCompressedPdf = async () => {
    try {
      const res = await fetch(`${API_BASE}/document/fetch?type=compressed&documentId=${documentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, "action": "fetchDocument", type: "compressed" }),
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

  if (!file)
    return (
      <div className="compress-empty">
        <h3>No PDF selected</h3>
        <p>Please upload a PDF first.</p>
      </div>
    );
  
  if (file.type !== "application/pdf")
    return (
      <div className="compress-empty">
        <h3>Invalid file type</h3>
        <p>Please upload a PDF file.</p>
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
          disabled={status === "processing"}
          className="btn-primary"
        >
          Compress
        </button>

        {status === "done" && (
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
