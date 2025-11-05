import React from 'react'

export default function ToolCard({ title, subtitle, icon }) {
  return (
    <div className="tool-card" role="button" tabIndex={0}>
      <div className="tool-icon">{icon}</div>
      <div className="tool-body">
        <div className="tool-title">{title}</div>
        <div className="tool-sub">{subtitle}</div>
      </div>
    </div>
  )
}
