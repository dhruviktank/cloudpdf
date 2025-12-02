export default function ProgressBar({ value = 0, label }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div>}
      <div style={{ width: '100%', height: 10, background: '#e5e7eb', borderRadius: 999 }}>
        <div style={{ width: pct + '%', height: '100%', background: '#4f46e5', borderRadius: 999 }} />
      </div>
    </div>
  )
}
