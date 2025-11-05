import React, { useState, useRef, useEffect } from 'react'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'
import { PDFDocument } from 'pdf-lib'

// Set workerSrc for pdfjs (works with Vite)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.js', import.meta.url).toString()

// API base (set VITE_API_BASE_URL in .env)
const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export default function PdfEditor() {
  const [pages, setPages] = useState([]) // { id, pageNumber, thumb }
  const [pdfBytes, setPdfBytes] = useState(null)
  const [pdfDoc, setPdfDoc] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [annotations, setAnnotations] = useState({}) // { pageNumber: [ {type, data} ] }
  const [status, setStatus] = useState('idle')
  const dragIndex = useRef(null)
  const previewCanvasRef = useRef(null)

  useEffect(() => {
    if (!pdfDoc || pages.length === 0) return
    renderPreview(pages[selectedIndex]?.pageNumber)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, pages, pdfDoc, annotations])

  async function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('loading')
    try {
      const arrayBuffer = await file.arrayBuffer()
      setPdfBytes(arrayBuffer)
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      setPdfDoc(pdf)
      const tmpPages = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 1 })
        const targetWidth = 180
        const scale = targetWidth / viewport.width
        const scaledViewport = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(scaledViewport.width)
        canvas.height = Math.round(scaledViewport.height)
        const ctx = canvas.getContext('2d')
        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise
        const thumb = canvas.toDataURL('image/png')
        tmpPages.push({ id: i, pageNumber: i, thumb })
      }
      setPages(tmpPages)
      setSelectedIndex(0)
      setAnnotations({})
      setStatus('ready')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  async function renderPreview(pageNumber) {
    if (!pdfDoc || !pageNumber) return
    const page = await pdfDoc.getPage(pageNumber)
    const canvas = previewCanvasRef.current
    if (!canvas) return
    const containerWidth = Math.min(800, window.innerWidth - 320)
    const viewport = page.getViewport({ scale: 1 })
    const scale = containerWidth / viewport.width
    const scaled = page.getViewport({ scale })
    canvas.width = Math.round(scaled.width)
    canvas.height = Math.round(scaled.height)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({ canvasContext: ctx, viewport: scaled }).promise

    // draw simple annotations overlay
    const pageNum = pageNumber
    const pageAnnos = annotations[pageNum] || []
    ctx.fillStyle = 'rgba(255, 255, 0, 0.15)'
    ctx.strokeStyle = 'rgba(255, 165, 0, 0.9)'
    pageAnnos.forEach((ann) => {
      if (ann.type === 'highlight') {
        const { x, y, w, h } = ann.data
        ctx.fillRect(x * canvas.width, y * canvas.height, w * canvas.width, h * canvas.height)
        ctx.strokeRect(x * canvas.width, y * canvas.height, w * canvas.width, h * canvas.height)
      } else if (ann.type === 'note') {
        ctx.fillStyle = 'rgba(0,0,0,0.7)'
        ctx.font = '14px sans-serif'
        ctx.fillText(ann.data.text, 10, 20 + Math.random() * 10)
      }
    })
  }

  function onDragStart(e, index) {
    dragIndex.current = index
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function onDrop(e, index) {
    e.preventDefault()
    const from = dragIndex.current
    const to = index
    if (from == null || to == null) return
    if (from === to) return
    const newPages = [...pages]
    const [moved] = newPages.splice(from, 1)
    newPages.splice(to, 0, moved)
    setPages(newPages)
    const newIndex = newPages.findIndex((p) => p.id === moved.id)
    setSelectedIndex(newIndex)
    dragIndex.current = null
  }

  async function buildReorderedPdfBytes() {
    if (!pdfBytes || pages.length === 0) return null
    const srcPdf = await PDFDocument.load(pdfBytes)
    const newPdf = await PDFDocument.create()
    const indices = pages.map((p) => p.pageNumber - 1)
    const copied = await newPdf.copyPages(srcPdf, indices)
    copied.forEach((p) => newPdf.addPage(p))
    const buf = await newPdf.save()
    return buf
  }

  async function downloadReordered() {
    const buf = await buildReorderedPdfBytes()
    if (!buf) return
    const blob = new Blob([buf], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'reordered.pdf'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function uploadBufferToS3(buffer, filename) {
    // request presigned URL from backend
    const res = await fetch(`${API_BASE}/presign-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename })
    })
    if (!res.ok) throw new Error('presign failed')
    const { url, key } = await res.json()
    // upload
    const putRes = await fetch(url, { method: 'PUT', body: buffer, headers: { 'Content-Type': 'application/pdf' } })
    if (!putRes.ok) throw new Error('upload failed')
    return key
  }

  async function uploadOriginalAndProcess() {
    if (!pdfBytes) return
    setStatus('uploading')
    try {
      const filename = `upload-${Date.now()}.pdf`
      const key = await uploadBufferToS3(pdfBytes, filename)
      // trigger server-side OCR & compression Lambda
      await fetch(`${API_BASE}/process`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, actions: ['ocr','compress'] }) })
      setStatus('processing')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  async function uploadReorderedAndProcess() {
    const buf = await buildReorderedPdfBytes()
    if (!buf) return
    setStatus('uploading')
    try {
      const filename = `reordered-${Date.now()}.pdf`
      const key = await uploadBufferToS3(buf, filename)
      await fetch(`${API_BASE}/process`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, actions: ['ocr','compress'] }) })
      setStatus('processing')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  function addNoteToPage() {
    const text = prompt('Enter note text')
    if (!text) return
    const pageNum = pages[selectedIndex]?.pageNumber
    if (!pageNum) return
    const current = annotations[pageNum] || []
    const note = { type: 'note', data: { text } }
    setAnnotations({ ...annotations, [pageNum]: [...current, note] })
  }

  function addHighlightToPage() {
    const pageNum = pages[selectedIndex]?.pageNumber
    if (!pageNum) return
    // simple fixed highlight for demo (top of page)
    const highlight = { type: 'highlight', data: { x: 0.05, y: 0.1, w: 0.9, h: 0.06 } }
    const current = annotations[pageNum] || []
    setAnnotations({ ...annotations, [pageNum]: [...current, highlight] })
  }

  async function sendAnnotationsToServer() {
    if (!pdfBytes) return
    // For server-side embedding, send annotations and original key (or upload reordered) to /annotate
    try {
      // If original hasn't been uploaded, upload original first
      const filename = `annotated-${Date.now()}.pdf`
      const key = await uploadBufferToS3(pdfBytes, filename)
      await fetch(`${API_BASE}/annotate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, annotations }) })
      alert('Annotations submitted for server-side processing')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <div className="pdf-editor">
      {(!pdfBytes || pages.length === 0) ? (
        <div className="empty-state" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:40}}>
          <div style={{maxWidth:720,textAlign:'center'}}>
            <h2>Upload a PDF to get started</h2>
            <p className="muted">Select a PDF file to view pages, reorder them, add simple annotations, and download or send to server for OCR/compression.</p>
            <div style={{marginTop:20}}>
              <label className="select-btn" style={{cursor:'pointer'}}>
                Select PDF File
                <input type="file" accept="application/pdf" onChange={onFileChange} style={{display:'none'}} />
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="editor-grid">
          <div className="left-col">
            <div className="upload-strip">
              <label className="select-btn small">
                Select PDF File
                <input type="file" accept="application/pdf" onChange={onFileChange} />
              </label>
              <button className="download-btn" onClick={downloadReordered} disabled={!pages.length}>Download Reordered PDF</button>
            </div>

            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button onClick={uploadOriginalAndProcess} disabled={!pdfBytes || status==='uploading'}>Upload Original & Process</button>
              <button onClick={uploadReorderedAndProcess} disabled={!pages.length || status==='uploading'}>Upload Reordered & Process</button>
            </div>

            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button onClick={addNoteToPage} disabled={!pages.length}>Add Note</button>
              <button onClick={addHighlightToPage} disabled={!pages.length}>Add Highlight</button>
              <button onClick={sendAnnotationsToServer} disabled={!pages.length}>Send Annotations to Server</button>
            </div>

            <div className="thumb-list" role="list">
              {status === 'loading' && <div className="muted">Loading PDF...</div>}
              {status === 'uploading' && <div className="muted">Uploading to server...</div>}
              {status === 'processing' && <div className="muted">Server processing (OCR/compression) in progress...</div>}
              {status === 'error' && <div className="muted">An error occurred. Check console/logs.</div>}

              {pages.map((p, i) => (
                <div
                  key={p.id}
                  className={`thumb-item ${i === selectedIndex ? 'selected' : ''}`}
                  draggable
                  onDragStart={(e) => onDragStart(e, i)}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, i)}
                  onClick={() => setSelectedIndex(i)}
                  role="listitem"
                >
                  <img src={p.thumb} alt={`Page ${p.pageNumber}`} />
                  <div className="thumb-caption">Page {p.pageNumber}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="right-col">
            <div className="preview-area">
              <canvas ref={previewCanvasRef} />
            </div>
            <div className="live-order">
              <h4>Live order</h4>
              <div className="live-grid">
                {pages.map((p, i) => (
                  <div key={`live-${p.id}`} className="live-thumb">
                    <img src={p.thumb} alt={`Page ${p.pageNumber}`} />
                    <div className="live-label">{i + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
