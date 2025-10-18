'use client';

import { useState } from 'react';
import SimpleLayout from '@/components/layout/SimpleLayout';
import { useAccessibility } from '@/hooks/useAccessibility';
import { FormField, Select, Checkbox } from '@/components/common/FormField';
import { ThemeToggle } from '@/components/common/ThemeToggle';

/**
 * 설정 페이지
 * - 접근성 설정
 * - 테마 설정
 * - 계정 설정
 * - 알림 설정
 */
export default function SettingsPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<'accessibility' | 'account' | 'notifications'>('accessibility');

  const {
    preferences,
    systemPreferences,
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize,
    setColorScheme,
  } = useAccessibility();

  const fontSizeOptions = [
    { value: 'small', label: '작게' },
    { value: 'medium', label: '보통' },
    { value: 'large', label: '크게' },
  ];

  const colorSchemeOptions = [
    { value: 'auto', label: '시스템 설정 따라가기' },
    { value: 'light', label: '라이트 모드' },
    { value: 'dark', label: '다크 모드' },
  ];

  const tabs = [
    { id: 'accessibility' as const, label: '접근성', icon: '♿' },
    { id: 'account' as const, label: '계정', icon: '👤' },
    { id: 'notifications' as const, label: '알림', icon: '🔔' },
  ];

  return (
    <SimpleLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 페이지 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              설정
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              애플리케이션 설정을 관리하고 사용자 경험을 개인화하세요.
            </p>
          </div>

          {/* 탭 네비게이션 */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-2 mb-6 border border-white/30 dark:border-gray-700/30 transition-colors duration-200">
            <div className="flex space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="space-y-6">
            {/* 접근성 설정 */}
            {activeTab === 'accessibility' && (
              <div className="space-y-6">
                {/* 시스템 감지 설정 */}
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 border border-white/30 dark:border-gray-700/30 transition-colors duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    시스템 감지 설정
                  </h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                      <p>
                        <strong>동작 효과 감소:</strong>{' '}
                        {systemPreferences.prefersReducedMotion ? '활성화됨' : '비활성화됨'}
                      </p>
                      <p>
                        <strong>고대비 모드:</strong>{' '}
                        {systemPreferences.prefersHighContrast ? '활성화됨' : '비활성화됨'}
                      </p>
                      <p>
                        <strong>컬러 스키마:</strong>{' '}
                        {systemPreferences.prefersColorScheme === 'dark' ? '다크 모드' : '라이트 모드'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 디스플레이 설정 */}
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 border border-white/30 dark:border-gray-700/30 transition-colors duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    디스플레이 설정
                  </h3>
                  <div className="space-y-6">
                    <FormField label="글꼴 크기" hint="화면의 전체 글꼴 크기를 조정합니다">
                      <Select
                        value={preferences.fontSize}
                        onChange={(e) => setFontSize(e.target.value as 'small' | 'medium' | 'large')}
                        options={fontSizeOptions}
                        aria-label="글꼴 크기 선택"
                      />
                    </FormField>

                    <FormField label="테마" hint="애플리케이션의 전체 테마를 설정합니다">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <Select
                            value={preferences.colorScheme}
                            onChange={(e) => setColorScheme(e.target.value as 'light' | 'dark' | 'auto')}
                            options={colorSchemeOptions}
                            aria-label="컬러 테마 선택"
                          />
                        </div>
                        <ThemeToggle variant="icon" size="lg" />
                      </div>
                    </FormField>
                  </div>
                </div>

                {/* 접근성 옵션 */}
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 border border-white/30 dark:border-gray-700/30 transition-colors duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    접근성 옵션
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Checkbox
                        label="고대비 모드 활성화"
                        checked={preferences.highContrast}
                        onChange={toggleHighContrast}
                        aria-describedby="high-contrast-desc"
                      />
                      <p
                        id="high-contrast-desc"
                        className="text-sm text-gray-600 dark:text-gray-400 ml-6"
                      >
                        텍스트와 배경의 대비를 높여 가독성을 향상시킵니다.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Checkbox
                        label="동작 효과 감소"
                        checked={preferences.reducedMotion}
                        onChange={toggleReducedMotion}
                        aria-describedby="reduced-motion-desc"
                      />
                      <p
                        id="reduced-motion-desc"
                        className="text-sm text-gray-600 dark:text-gray-400 ml-6"
                      >
                        애니메이션과 전환 효과를 최소화합니다.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 키보드 단축키 */}
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 border border-white/30 dark:border-gray-700/30 transition-colors duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    📋 키보드 단축키
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span>다음 요소로 이동</span>
                      <kbd className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                        Tab
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span>이전 요소로 이동</span>
                      <kbd className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                        Shift + Tab
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span>선택/실행</span>
                      <kbd className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                        Enter
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span>모달 닫기</span>
                      <kbd className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                        Esc
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span>체크박스 토글</span>
                      <kbd className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                        Space
                      </kbd>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 계정 설정 */}
            {activeTab === 'account' && (
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 border border-white/30 dark:border-gray-700/30 transition-colors duration-200">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  계정 설정
                </h3>
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-blue-500 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      준비 중입니다
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      계정 설정 기능은 곧 추가될 예정입니다.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 알림 설정 */}
            {activeTab === 'notifications' && (
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 border border-white/30 dark:border-gray-700/30 transition-colors duration-200">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  알림 설정
                </h3>
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-yellow-500 dark:text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      준비 중입니다
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      알림 설정 기능은 곧 추가될 예정입니다.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </SimpleLayout>
  );
}
