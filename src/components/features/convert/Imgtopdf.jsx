import React, { useEffect, useRef, useState } from "react";
import { Cropper } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import { PDFDocument } from "pdf-lib";

export default function ImgToPdf({ file }) {
  const cropperRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const rotateImage = () => {
    // if (!cropperRef.current) return;
    // cropperRef.current.rotate(90);
  };

  const generatePdf = async () => {
    if (!cropperRef.current) return;

    // Get cropped canvas from cropper
    const canvas = cropperRef.current.getCanvas();

    if (!canvas) {
      alert("Crop area is empty");
      return;
    }

    const imgBytes = await new Promise((resolve) =>
      canvas.toBlob(async (blob) => {
        resolve(await blob.arrayBuffer());
      }, "image/png")
    );

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4

    const image = await pdfDoc.embedPng(imgBytes);

    const scale = Math.min(
      page.getWidth() / image.width,
      page.getHeight() / image.height
    );

    page.drawImage(image, {
      x: (page.getWidth() - image.width * scale) / 2,
      y: (page.getHeight() - image.height * scale) / 2,
      width: image.width * scale,
      height: image.height * scale,
    });

    const pdfBytes = await pdfDoc.save();

    // Optional: download PDF
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "document.pdf";
    link.click();
  };

  if (!imageSrc) return null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Cropper */}
      <div
        style={{
          height: 450,
          background: "#fff",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <Cropper
          ref={cropperRef}
          src={imageSrc}
          className="cropper"
          stencilProps={{
            movable: true,
            resizable: true,
            aspectRatio: undefined, // Free crop
          }}
          defaultSize={({ imageSize }) => ({
            width: imageSize.width * 0.8,
            height: imageSize.height * 0.8,
          })}
        />
      </div>

      {/* Controls */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          gap: 12,
          justifyContent: "center",
        }}
      >
        <button onClick={rotateImage}>Rotate</button>
        <button onClick={generatePdf}>Create PDF</button>
      </div>
    </div>
  );
}
