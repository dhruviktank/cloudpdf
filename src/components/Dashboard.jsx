import React from 'react'
import ToolCard from './ToolCard'
import FileCard from './FileCard'
import PdfEditor from './PdfEditor'

const tools = [
  { title: 'Image to PDF', subtitle: 'Convert images (JPG, PNG) into a single PDF', icon: '🖼️' },
  { title: 'Merge & Split PDF', subtitle: 'Combine multiple PDFs or extract selected pages', icon: '🔗' },
  { title: 'Compress PDF', subtitle: 'Reduce the file size of your PDF while maintaining quality', icon: '📦' },
  { title: 'OCR', subtitle: 'Extract text from scanned PDFs or images using Optical Character Recognition', icon: '📄' }
];

const recent = [
]

export default function Dashboard() {
  return (
    <div className="dashboard">
      <PdfEditor />

      <section className="quick-tools">
        <h3>Quick Tools</h3>
        <div className="tools-grid">
          {tools.map((t) => (
            <ToolCard key={t.title} title={t.title} subtitle={t.subtitle} icon={t.icon} />
          ))}
        </div>
      </section>

      <section className="recent">
        <h3>Recent Documents</h3>
        <div className="recent-list">
            {recent.length === 0 ? (
              <div className="placeholder">No recent documents</div>
            ) : (
              recent.map((r) => (
                <FileCard key={r.name} name={r.name} date={r.date} color={r.color} />
              ))
            )}
        </div>
      </section>
    </div>
  )
}
