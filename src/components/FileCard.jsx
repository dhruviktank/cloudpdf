import React from 'react'

export default function FileCard({ name, date, color = '#FEE2E2' }) {
  return (
    <div className="file-card">
      <div className="file-thumb" style={{ background: color }}>PDF</div>
      <div className="file-info">
        <div className="file-name">{name}</div>
        <div className="file-meta">{date}</div>
      </div>
    </div>
  )
}
