import { useState } from 'react'
import ChatKitPanel from './components/ChatKitPanel'
import Sidebar from './components/Sidebar'
import Header from './components/Header'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-hidden">
          <ChatKitPanel />
        </main>
      </div>
    </div>
  )
}
