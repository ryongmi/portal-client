'use client';

import { useState } from 'react';
import SimpleLayout from '@/components/layout/SimpleLayout';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

/**
 * 도움말 페이지
 * - FAQ (자주 묻는 질문)
 * - 사용 가이드
 * - 문의하기
 */
export default function HelpPage(): JSX.Element {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const faqs: FAQItem[] = [
    {
      category: 'account',
      question: '로그인은 어떻게 하나요?',
      answer:
        '홈페이지의 "로그인하기" 버튼을 클릭하면 SSO(Single Sign-On) 로그인 페이지로 이동합니다. Google 또는 Naver 계정으로 간편하게 로그인할 수 있습니다.',
    },
    {
      category: 'account',
      question: '계정 통합이란 무엇인가요?',
      answer:
        '계정 통합은 여러 OAuth 제공자(Google, Naver 등)의 계정을 하나의 사용자 계정으로 연결하는 기능입니다. 이를 통해 다양한 서비스에 더욱 편리하게 접근할 수 있습니다.',
    },
    {
      category: 'services',
      question: '서비스에 접근하려면 어떻게 해야 하나요?',
      answer:
        '로그인 후 홈페이지에서 사용 가능한 서비스 목록을 확인할 수 있습니다. 각 서비스 카드를 클릭하면 해당 서비스로 이동합니다. 일부 서비스는 특정 권한이 필요할 수 있습니다.',
    },
    {
      category: 'services',
      question: '서비스 접근 권한은 어떻게 부여받나요?',
      answer:
        '서비스 접근 권한은 관리자가 사용자에게 역할(Role)과 권한(Permission)을 할당하여 부여됩니다. 필요한 서비스에 접근할 수 없다면 관리자에게 문의하세요.',
    },
    {
      category: 'profile',
      question: '프로필 정보는 어디서 확인하나요?',
      answer:
        '우측 상단의 사용자 아이콘을 클릭하고 "프로필 설정"을 선택하면 계정 정보, 권한, OAuth 인증 상태 등을 확인할 수 있습니다.',
    },
    {
      category: 'profile',
      question: '이메일 인증은 왜 필요한가요?',
      answer:
        '이메일 인증은 계정의 보안을 강화하고 본인 확인을 위해 필요합니다. 인증되지 않은 계정은 일부 기능에 제한이 있을 수 있습니다.',
    },
    {
      category: 'settings',
      question: '다크 모드는 어떻게 활성화하나요?',
      answer:
        '우측 상단의 달/태양 아이콘을 클릭하면 다크 모드와 라이트 모드를 전환할 수 있습니다. 또는 "설정" 페이지에서 테마를 선택할 수 있습니다.',
    },
    {
      category: 'settings',
      question: '접근성 설정은 어디서 변경하나요?',
      answer:
        '"설정" 페이지의 "접근성" 탭에서 글꼴 크기, 고대비 모드, 동작 효과 감소 등의 접근성 옵션을 설정할 수 있습니다.',
    },
    {
      category: 'technical',
      question: '지원되는 브라우저는 무엇인가요?',
      answer:
        '최신 버전의 Chrome, Firefox, Safari, Edge를 지원합니다. 최상의 사용 경험을 위해 항상 최신 버전의 브라우저를 사용하는 것을 권장합니다.',
    },
    {
      category: 'technical',
      question: '문제가 발생했을 때 어떻게 해야 하나요?',
      answer:
        '먼저 페이지를 새로고침하거나 브라우저 캐시를 삭제해 보세요. 문제가 지속되면 관리자에게 문의하거나 이슈 트래커에 버그를 보고해 주세요.',
    },
  ];

  const categories = [
    { id: 'all', label: '전체', icon: '📚' },
    { id: 'account', label: '계정', icon: '👤' },
    { id: 'services', label: '서비스', icon: '🔧' },
    { id: 'profile', label: '프로필', icon: '📝' },
    { id: 'settings', label: '설정', icon: '⚙️' },
    { id: 'technical', label: '기술', icon: '💻' },
  ];

  const filteredFAQs =
    activeCategory === 'all' ? faqs : faqs.filter((faq) => faq.category === activeCategory);

  const toggleFAQ = (index: number): void => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <SimpleLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 페이지 헤더 */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              도움말
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              자주 묻는 질문과 사용 가이드를 확인하세요.
            </p>
          </div>

          {/* 빠른 링크 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <a
              href="mailto:support@krgeobuk.com"
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 border border-white/30 dark:border-gray-700/30 hover:shadow-lg transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg
                    className="w-6 h-6 text-blue-500 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">이메일 문의</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    support@krgeobuk.com
                  </p>
                </div>
              </div>
            </a>

            <a
              href="https://github.com/krgeobuk/portal"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 border border-white/30 dark:border-gray-700/30 hover:shadow-lg transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg
                    className="w-6 h-6 text-purple-500 dark:text-purple-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">GitHub</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">이슈 보고</p>
                </div>
              </div>
            </a>

            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 border border-white/30 dark:border-gray-700/30">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-500 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">문서</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">개발자 가이드</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ 섹션 */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 border border-white/30 dark:border-gray-700/30 transition-colors duration-200">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              자주 묻는 질문 (FAQ)
            </h2>

            {/* 카테고리 필터 */}
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeCategory === category.id
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.label}
                </button>
              ))}
            </div>

            {/* FAQ 리스트 */}
            <div className="space-y-3">
              {filteredFAQs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                  >
                    <span className="font-medium text-gray-900 dark:text-gray-100 pr-4">
                      {faq.question}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                        openFAQ === index ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {openFAQ === index && (
                    <div className="px-4 pb-4 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredFAQs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  해당 카테고리에 FAQ가 없습니다.
                </p>
              </div>
            )}
          </div>

          {/* 추가 도움말 */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              💡 도움이 더 필요하신가요?
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              위의 FAQ에서 답을 찾지 못하셨다면 언제든지 문의해 주세요. 최대한 빠르게 도와드리겠습니다.
            </p>
            <a
              href="mailto:support@krgeobuk.com"
              className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200"
            >
              문의하기
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </a>
          </div>
        </main>
      </div>
    </SimpleLayout>
  );
}
