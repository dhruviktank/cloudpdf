import { useState } from 'react'
import Topbar from './components/Topbar'
import Sidebar from './components/Sidebar'
import PdfEditor from './components/PdfEditor'

export default function App() {
  const [activeFeature, setActiveFeature] = useState({ group: 'organize', feature: 'reorder' })
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)       // ⬅ NEW

  return (
    <div className="app-root">
      <Sidebar 
        onSelectFeature={(group, feature) => setActiveFeature({ group, feature })}
        isOpen={isSidebarOpen}                    // ⬅ CONTROLLED
        setIsOpen={setIsSidebarOpen}              // ⬅ PASSED DOWN
        activeFeature={activeFeature}
      />

      <div className="main-area">
        <Topbar 
          activeFeature={activeFeature}
          isSidebarOpen={isSidebarOpen}           // ⬅ Topbar knows sidebar state
          setIsSidebarOpen={setIsSidebarOpen}     // ⬅ Topbar controls it
        />

        <main className="content">
          <div className="dashboard">
            <PdfEditor activeFeature={activeFeature} />
          </div>
        </main>
      </div>
    </div>
  )
}
