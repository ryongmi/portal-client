'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface MenuItem {
  id: string
  label: string
  icon: JSX.Element
  path?: string
  children?: MenuItem[]
}

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps): JSX.Element {
  const [activeMenu, setActiveMenu] = useState<string>('')
  const [currentPath, setCurrentPath] = useState<string>('')
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setCurrentPath(pathname)
    
    // 사용자 포털에서는 기본적으로 모든 메뉴를 닫아둡니다
    setActiveMenu('')
  }, [pathname])

  const menuItems: MenuItem[] = [
    {
      id: 'home',
      label: '홈',
      path: '/',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'services',
      label: '서비스',
      path: '/',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      id: 'profile',
      label: '프로필',
      path: '#',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: '설정',
      path: '#',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ]

  const handleMenuClick = (menuId: string): void => {
    setActiveMenu(activeMenu === menuId ? '' : menuId)
  }

  const navigateToPage = (path: string): void => {
    router.push(path)
  }

  const renderMenuItem = (item: MenuItem, level: number = 0): JSX.Element => {
    const isActive = activeMenu === item.id
    const hasChildren = item.children && item.children.length > 0
    const isCurrentPath = item.path === currentPath

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (item.path) {
              navigateToPage(item.path)
            } else {
              handleMenuClick(item.id)
            }
          }}
          className={`w-full flex items-center rounded-lg transition-colors ${
            level === 0 ? 'text-gray-900' : 'text-gray-600 ml-4'
          } hover:bg-gray-100 ${
            isCurrentPath 
              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' 
              : isActive 
                ? 'bg-gray-100' 
                : ''
          } ${
            isOpen 
              ? 'justify-between px-4 py-3 text-left text-sm font-medium' 
              : 'justify-center p-3'
          }`}
          title={!isOpen ? item.label : undefined}
        >
          <div className={`flex items-center ${isOpen ? 'space-x-3' : ''}`}>
            {item.icon}
            {isOpen && <span>{item.label}</span>}
          </div>
          {hasChildren && isOpen && (
            <svg
              className={`h-4 w-4 transition-transform ${isActive ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
        {hasChildren && isActive && isOpen && (
          <div className="mt-1 space-y-1">
            {item.children?.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* 사이드바 */}
      <div
        className={`fixed top-16 bottom-0 left-0 z-50 bg-white shadow-xl transform transition-all duration-300 ease-in-out lg:static lg:top-0 lg:h-full ${
          isOpen 
            ? 'w-64 translate-x-0' 
            : 'w-64 -translate-x-full lg:w-16 lg:translate-x-0'
        }`}
      >
        <div className={`flex items-center h-16 border-b border-gray-200 ${isOpen ? 'justify-between px-4' : 'justify-center px-2'}`}>
          {isOpen && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 lg:hidden">메뉴</h2>
              <h2 className="text-lg font-semibold text-gray-900 hidden lg:block">KRGeobuk</h2>
            </>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            {isOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        
        <nav className={`space-y-2 flex-1 overflow-y-auto ${isOpen ? 'p-4' : 'p-2'}`}>
          {menuItems.map((item) => renderMenuItem(item))}
        </nav>
      </div>
    </>
  )
}