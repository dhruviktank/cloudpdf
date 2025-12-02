import { useState, useEffect, lazy, Suspense } from "react";

import FileUpload from "./common/FileUpload";
import ComingSoon from "./features/ComingSoon.jsx";

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

export default function PdfEditor({ activeFeature }) {
  const [file, setFile] = useState(null);
  const [ActiveComponent, setActiveComponent] = useState(null);

  useEffect(() => {
    if (!activeFeature) return;

    const Comp = featureMap[activeFeature.feature];
    if (Comp) setActiveComponent(() => Comp);
    else
      setActiveComponent(() => () => (
        <ComingSoon feature={activeFeature.feature} />
      ));
  }, [activeFeature]);

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
  };

  return (
    <div>
      {!file ? (
        <div style={{ width: "100%", textAlign: "center", marginTop: 80 }}>
          <h2>Upload a PDF</h2>
          <FileUpload onSelect={handleFileSelect} />
          <p style={{ color: "#64748b", marginTop: 12 }}>Supported: PDF up to 10 MB</p>
        </div>
      ) : (
        <>
          {!ActiveComponent ? (
            <ComingSoon feature={activeFeature?.feature} />
          ) : (
            <Suspense fallback={<div style={{ padding: 50 }}>Loading...</div>}>
              <ActiveComponent file={file} />
            </Suspense>
          )}
        </>
      )}
    </div>
  );
}
