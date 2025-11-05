import React from 'react'

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="search-area">&nbsp;</div>
      <div className="top-actions">
        {/* <button className="upgrade">Upgrade</button> */}
        <button className="icon">🔔</button>
        <button className="icon">❓</button>
      </div>
    </header>
  )
}
