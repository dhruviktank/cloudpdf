import { useState } from 'react'
import Topbar from './components/Topbar'
import Sidebar from './components/Sidebar'
import PdfEditor from './components/PdfEditor'

export default function App() {
  const [activeFeature, setActiveFeature] = useState({ label: 'Compress PDF', id: 'compress' })
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)       

  return (
    <div className="app-root">
      <Sidebar 
        onSelectFeature={(feature) => setActiveFeature(feature)}
        isOpen={isSidebarOpen}                    
        setIsOpen={setIsSidebarOpen}              
        activeFeature={activeFeature}
      />

      <div className="main-area">
        <Topbar 
          activeFeature={activeFeature}
          isSidebarOpen={isSidebarOpen}           
          setIsSidebarOpen={setIsSidebarOpen}     
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
