import React from 'react'

export default function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Primary">
      <div className="brand">
        <div className="logo">📦</div>
        <div className="brand-text">
          <strong>CloudPDF</strong>
        </div>
      </div>

      <nav className="nav">
        <ul>
          <li className="active">Home</li>
          <li>My Files</li>
          <li>Tools</li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="link-btn">Settings</button>
        <button className="link-btn">Logout</button>
      </div>
    </aside>
  )
}
