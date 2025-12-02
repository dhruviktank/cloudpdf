import { Menu, HelpCircle } from "lucide-react";

function formatFeature(activeFeature) {
  if (!activeFeature) return 'Dashboard'
  const { group, feature } = activeFeature
  if (group === 'compress') return 'Compress PDF'
  if (group === 'organize' && feature === 'reorder') return 'Reorder Pages'
  if (group === 'edit' && feature === 'rotate') return 'Rotate Pages'
  if (group === 'organize' && feature === 'delete-pages') return 'Delete Pages'
  return `${group}${feature ? ' / ' + feature : ''}`
}

export default function Topbar({ activeFeature, isSidebarOpen, setIsSidebarOpen }) {
  const title = formatFeature(activeFeature)
  

  return (
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
        {title}
      </div>

      {/* RIGHT SIDE ICONS */}
      <div className="top-actions">
        <button className="icon" aria-label="Help"><HelpCircle /></button>
      </div>

    </header>
  )
}
