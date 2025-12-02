import React, { useRef } from 'react'
import { UploadCloud } from "lucide-react";

export default function FileUpload({
  onSelect,
  accept = "application/pdf",
  label = "Choose PDF",
  disabled = false
}) {
  const inputRef = useRef(null);

  function handleClick() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (file && onSelect) onSelect(file);
    e.target.value = "";
  }

  return (
    <div
      className={`upload-box ${disabled ? "disabled" : ""}`}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) =>
        e.key === "Enter" || e.key === " " ? handleClick() : null
      }
    >
      <UploadCloud className="upload-icon" />
      <p className="upload-title">{label}</p>
      <p className="upload-subtext">Click to upload or select from your device</p>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        style={{ display: "none" }}
      />
    </div>
  );
}
