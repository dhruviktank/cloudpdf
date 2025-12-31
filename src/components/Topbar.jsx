import { useState } from "react";
import { Menu, HelpCircle, X } from "lucide-react";

export default function Topbar({ activeFeature, isSidebarOpen, setIsSidebarOpen }) {
  const [showArchitecture, setShowArchitecture] = useState(false);

  return (
    <>
      <header className="topbar">
        {/* MOBILE SIDEBAR TOGGLE */}
        <button
          className="mobile-toggle-btn"
          aria-label="Toggle sidebar"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu />
        </button>

        {/* PAGE TITLE */}
        <div className="search-area" style={{ fontWeight: 600, fontSize: 18 }}>
          {activeFeature.label || "Dashboard"}
        </div>

        {/* HELP ICON */}
        <div className="top-actions">
          <button
            className="icon"
            aria-label="Help"
            onClick={() => setShowArchitecture(true)}
          >
            <HelpCircle />
          </button>
        </div>
      </header>

      {/* ---- ARCHITECTURE MODAL ---- */}
      {showArchitecture && (
        <div className="modal-overlay" onClick={() => setShowArchitecture(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              maxWidth: "65%",
              maxHeight: "85%",
              overflow: "auto",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowArchitecture(false)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <X size={22} />
            </button>

            <h2 style={{ marginBottom: "12px", fontWeight: 600 }}>System Architecture</h2>

            {/* Load from public folder */}
            <img
              src="image.png"
              alt="System Architecture"
              style={{
                width: "100%",
                height: "auto",
              }}
            />
          </div>
        </div>
      )}

      {/* ---- MODAL STYLES ---- */}
      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }
      `}</style>
    </>
  );
}
