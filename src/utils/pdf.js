import { PDFDocument } from "pdf-lib";
import { degrees } from "pdf-lib";
export async function saveUpdatedPdf(originalFile, pageOrder, rotations = {}) {

  const originalPdfBytes = await originalFile.arrayBuffer();
  const originalPdf = await PDFDocument.load(originalPdfBytes);

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

  const blob = new Blob([newPdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `edited_${originalFile.name}`;
  a.click();

  URL.revokeObjectURL(url);
}
