import React from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './components/Dashboard'

export default function App() {
  return (
    <div className="app-root">
      <Sidebar />
      <div className="main-area">
        <Topbar />
        <main className="content">
          <Dashboard />
        </main>
      </div>
    </div>
  )
}
