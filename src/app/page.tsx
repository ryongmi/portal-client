'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { mockServices } from '@/data/mockData'

export default function Home(): JSX.Element {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const visibleServices = mockServices.filter(service => service.isVisible)

  // 메뉴 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (userMenuOpen && !target.closest('.user-menu')) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [userMenuOpen])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 헤더 */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-white/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent">
                KRGeobuk Portal
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link 
                href="/auth/login" 
                className="text-gray-600 hover:text-blue-500 font-medium transition-colors duration-200"
              >
                로그인
              </Link>
              <Link 
                href="/auth/register" 
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                회원가입
              </Link>
              <Link 
                href="/admin" 
                className="inline-flex items-center px-3 py-2 text-gray-500 hover:text-blue-500 text-sm font-medium rounded-lg hover:bg-blue-50 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                관리자
              </Link>
              
              {/* 사용자 메뉴 */}
              <div className="relative user-menu">
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                
                {/* 드롭다운 메뉴 */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/30 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-700">사용자 이름</p>
                      <p className="text-xs text-gray-500">user@example.com</p>
                    </div>
                    
                    <div className="py-1">
                      <a 
                        href="#" 
                        className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        프로필 설정
                      </a>
                      
                      <a 
                        href="#" 
                        className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        계정 보안
                      </a>
                      
                      <a 
                        href="#" 
                        className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        설정
                      </a>
                      
                      <a 
                        href="#" 
                        className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        도움말
                      </a>
                    </div>
                    
                    <div className="border-t border-gray-100 py-1">
                      <button 
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 헤로 섹션 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-6">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            통합 서비스 포탈
          </div>
          <h2 className="text-5xl font-bold bg-gradient-to-r from-gray-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent mb-6">
            KRGeobuk 서비스 포탈
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            모든 서비스에 쉽고 빠르게 접근하세요. <br />
            통합된 환경에서 효율적으로 작업할 수 있습니다.
          </p>
          
          {/* 통계 섹션 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 max-w-2xl mx-auto">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30">
              <div className="text-3xl font-bold text-blue-600 mb-2">{visibleServices.length}</div>
              <div className="text-sm text-gray-500">사용 가능한 서비스</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {visibleServices.filter(s => !s.isVisibleByRole).length}
              </div>
              <div className="text-sm text-gray-500">공개 서비스</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {visibleServices.filter(s => s.isVisibleByRole).length}
              </div>
              <div className="text-sm text-gray-500">권한 기반 서비스</div>
            </div>
          </div>
        </div>
        
        {/* 서비스 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleServices.map((service, index) => (
            <div 
              key={service.id} 
              className="group relative bg-white/85 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* 카드 배경 그라데이션 */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* 카드 테두리 효과 */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
              
              <div className="relative p-8">
                {/* 헤더 */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      {service.iconUrl ? (
                        <img 
                          src={service.iconUrl} 
                          alt={service.displayName || service.name}
                          className="w-12 h-12 rounded-xl shadow-md"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-20 blur rounded-xl transition-opacity duration-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-700 group-hover:text-blue-600 transition-colors duration-200">
                        {service.displayName || service.name}
                      </h3>
                      <div className="flex items-center mt-2">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                          service.isVisibleByRole 
                            ? 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800' 
                            : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800'
                        }`}>
                          <svg className={`w-3 h-3 mr-1 ${service.isVisibleByRole ? 'text-orange-500' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d={service.isVisibleByRole 
                              ? "M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                              : "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            } clipRule="evenodd" />
                          </svg>
                          {service.isVisibleByRole ? '권한 기반' : '공개'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 설명 */}
                <p className="text-gray-500 mb-8 leading-relaxed text-base">
                  {service.description}
                </p>
                
                {/* 액션 버튼 */}
                <div className="flex justify-end">
                  <a
                    href={service.baseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl group-hover:shadow-blue-500/25"
                  >
                    <span>서비스 이동</span>
                    <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 서비스가 없을 때 */}
        {visibleServices.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">서비스가 없습니다</h3>
            <p className="text-gray-500">현재 이용 가능한 서비스가 없습니다.</p>
          </div>
        )}
      </main>
    </div>
  )
}