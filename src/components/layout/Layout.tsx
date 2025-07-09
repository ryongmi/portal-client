'use client'

import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)

  const handleMenuToggle = (): void => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleSidebarToggle = (): void => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuToggle={handleMenuToggle} />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
        
        <main className="flex-1 transition-all duration-300 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}