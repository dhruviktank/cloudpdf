import { PDFDocument, degrees } from "pdf-lib";
import { uploadBufferToS3 } from "./s3";

export async function createNewPdfFromImage(imageFile, documentId, sessionId) {
  try {
    const imageBytes = await imageFile.arrayBuffer();
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);

    const image = await pdfDoc.embedJpg(imageBytes);
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
    return new Blob([pdfBytes], { type: "application/pdf" });
  } catch (err) {
    console.error("Error creating PDF from image:", err);
    throw err;
  }
}

/* ------------------ Save / Update PDF ------------------ */
export async function saveUpdatedPdf(originalFile, pageOrder, rotations, documentId, sessionId) {
  try {
    // --- 1) Load original PDF ---
    const originalPdfBytes = await originalFile.arrayBuffer();
    const originalPdf = await PDFDocument.load(originalPdfBytes);

    // --- 2) Create new PDF with pages + rotation ---
    const newPdf = await PDFDocument.create();
    for (const pageNum of pageOrder) {
      const [copiedPage] = await newPdf.copyPages(originalPdf, [pageNum - 1]);
      const page = copiedPage;

      if (rotations[pageNum]) {
        page.setRotation(degrees(rotations[pageNum]));
      }

      newPdf.addPage(page);
    }

    const newPdfBytes = await newPdf.save();
    const editedBlob = new Blob([newPdfBytes], { type: "application/pdf" });

    // --- 3) Request presigned PUT URL ---
    // const res = await fetch(
    //   "https://48wc3410yf.execute-api.us-east-1.amazonaws.com/document/upload",
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //       "x-session-id": sessionId,
    //     },
    //     body: JSON.stringify({ action: "updateEditedDocument", documentId }),
    //   }
    // );

    // if (!res.ok) throw new Error("Failed getting presigned URL for edited PDF");

    // const { uploadUrl } = await res.json();

    // // --- 4) Upload to S3 ---
    // const uploadRes = await fetch(uploadUrl, {
    //   method: "PUT",
    //   headers: { "Content-Type": "application/pdf" },
    //   body: editedBlob
    // });

    // if (!uploadRes.ok) throw new Error("Failed uploading edited PDF to S3");
    await uploadBufferToS3(
      sessionId,
      editedBlob,
      `edited_${originalFile.name}`
    );

    // --- 5) Trigger browser download ---
    const downloadBlob = new Blob([newPdfBytes], { type: "application/pdf" });
    const downloadUrl = URL.createObjectURL(downloadBlob);

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `edited_${originalFile.name}`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(downloadUrl);

    return { success: true };

  } catch (err) {
    console.error("Save failed:", err);
    return { success: false, error: err.message };
  }
}

/* ------------------ Fetch Recent Files ------------------ */
export async function fetchRecentFiles(userId) {
  try {
    if (!userId) throw new Error("Missing userId");

    const res = await fetch(
      `https://48wc3410yf.execute-api.us-east-1.amazonaws.com/document/fetch?sessionId=${userId}&action=fetchRecentDocuments`
    );

    if (!res.ok) throw new Error("Failed fetching recent files");

    const files = await res.json();
    // Expected format: [{ documentId, name, uploadedAt, s3Key }]
    return files.documents || [];
  } catch (err) {
    console.error("Error fetching recent files:", err);
    return [];
  }
}
