'use client'

import { useState } from 'react'
import Link from 'next/link'

interface HeaderProps {
  onMenuToggle: () => void
}

export default function Header({ onMenuToggle }: HeaderProps): JSX.Element {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 모바일 메뉴 버튼 */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* 로고 */}
          <div className="flex items-center">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 cursor-pointer">
                KRGeobuk Portal Admin
              </h1>
            </Link>
          </div>
          
          {/* 사용자 정보 */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <span className="text-sm text-gray-600">관리자</span>
            </div>
            <div className="relative">
              <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}