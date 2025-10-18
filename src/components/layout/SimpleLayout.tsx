'use client'

import Header from './Header'
import { useSkipLink } from '@/hooks/useFocusManagement'

interface SimpleLayoutProps {
  children: React.ReactNode
}

/**
 * SimpleLayout - Sidebar 없는 단순 레이아웃
 * portal-client용 레이아웃 (단일 페이지 애플리케이션)
 *
 * 특징:
 * - Header만 포함 (Sidebar 제외)
 * - 접근성 기능 (Skip Links) 포함
 * - 다크모드 지원
 * - 전체 너비 레이아웃
 */
export default function SimpleLayout({ children }: SimpleLayoutProps): JSX.Element {
  const { skipLinkRef, handleSkipToContent } = useSkipLink()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Skip Links for Keyboard Navigation */}
      <div className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:bg-blue-600 focus:text-white focus:p-2 focus:z-50">
        <a
          ref={skipLinkRef}
          href="#main-content"
          onKeyDown={handleSkipToContent}
          className="focus:outline-none focus:ring-2 focus:ring-white"
        >
          메인 콘텐츠로 바로가기
        </a>
      </div>

      {/* Header (Sidebar 없음) */}
      <Header />

      {/* Main Content - 전체 너비 */}
      <main
        id="main-content"
        className="w-full transition-all duration-300"
        role="main"
        tabIndex={-1}
        aria-label="주요 콘텐츠"
      >
        {children}
      </main>
    </div>
  )
}
