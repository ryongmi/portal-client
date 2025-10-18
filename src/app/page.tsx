'use client';

import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import Image from 'next/image';
import SimpleLayout from '@/components/layout/SimpleLayout';

export default function Home(): JSX.Element {
  const { isAuthenticated } = useAuth();
  const { availableServices, loading: servicesLoading, error: servicesError } = useUserProfile();

  // SSO 로그인 처리
  const handleLogin = (): void => {
    const returnUrl = typeof window !== 'undefined' ? window.location.pathname : '/';
    const redirectUri = encodeURIComponent(`${window.location.origin}${returnUrl}`);
    const ssoStartUrl = `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/auth/login?redirect_uri=${redirectUri}`;
    window.location.href = ssoStartUrl;
  };

  // 인증된 사용자는 availableServices 사용, 미인증 사용자는 빈 배열
  const visibleServices = isAuthenticated ? availableServices : [];

  return (
    <SimpleLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
        {/* 메인 컨텐츠 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 헤로 섹션 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full mb-6 transition-colors duration-200">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            통합 서비스 포탈
          </div>
          <h2 className="text-5xl font-bold bg-gradient-to-r from-gray-700 via-blue-700 to-indigo-700 dark:from-gray-100 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-6">
            KRGeobuk 서비스 포탈
          </h2>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed transition-colors duration-200">
            모든 서비스에 쉽고 빠르게 접근하세요. <br />
            통합된 환경에서 효율적으로 작업할 수 있습니다.
          </p>

          {/* 통계 섹션 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 max-w-2xl mx-auto">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 dark:border-gray-700/30 transition-colors duration-200">
              {isAuthenticated && servicesLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-300 rounded w-12 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-blue-500 dark:text-blue-400 mb-2">
                    {visibleServices.length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">사용 가능한 서비스</div>
                </>
              )}
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 dark:border-gray-700/30 transition-colors duration-200">
              {isAuthenticated && servicesLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-12 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {visibleServices.filter((s) => !s.isVisibleByRole).length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">공개 서비스</div>
                </>
              )}
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 dark:border-gray-700/30 transition-colors duration-200">
              {isAuthenticated && servicesLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-12 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                    {visibleServices.filter((s) => s.isVisibleByRole).length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">권한 기반 서비스</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 서비스 카드 그리드 */}
        {/* 로딩 상태 */}
        {isAuthenticated && servicesLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="bg-white/85 dark:bg-gray-800/85 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 dark:border-gray-700/30 p-8 animate-pulse transition-colors duration-200"
              >
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
                  <div>
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-8"></div>
                <div className="flex justify-end">
                  <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded-xl w-24"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 에러 상태 */}
        {isAuthenticated && servicesError && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors duration-200">
              <svg
                className="w-12 h-12 text-red-500 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
              서비스 목록을 불러올 수 없습니다
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{servicesError}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              새로고침
            </button>
          </div>
        )}

        {/* 정상 상태 - 서비스 목록 */}
        {(!isAuthenticated || (!servicesLoading && !servicesError)) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleServices.map((service, index) => (
              <div
                key={service.id}
                className="group relative bg-white/85 dark:bg-gray-800/85 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 dark:border-gray-700/30 hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* 카드 배경 그라데이션 */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* 카드 테두리 효과 */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 dark:from-blue-500/30 dark:to-indigo-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

                <div className="relative p-8">
                  {/* 헤더 */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {service.iconUrl ? (
                          <Image
                            src={service.iconUrl}
                            alt={(service.displayName || service.name) ?? ''}
                            className="w-12 h-12 rounded-xl shadow-md"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                          </div>
                        )}
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-20 blur rounded-xl transition-opacity duration-300" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors duration-200">
                          {service.displayName || service.name}
                        </h3>
                        <div className="flex items-center mt-2">
                          <span
                            className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                              service.isVisibleByRole
                                ? 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800'
                                : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800'
                            }`}
                          >
                            <svg
                              className={`w-3 h-3 mr-1 ${
                                service.isVisibleByRole ? 'text-orange-500' : 'text-green-500'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d={
                                  service.isVisibleByRole
                                    ? 'M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
                                    : 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                }
                                clipRule="evenodd"
                              />
                            </svg>
                            {service.isVisibleByRole ? '권한 기반' : '공개'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 설명 */}
                  <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed text-base transition-colors duration-200">
                    {service.description}
                  </p>

                  {/* 액션 버튼 */}
                  <div className="flex justify-end">
                    <a
                      href={service.baseUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-400 to-indigo-400 text-gray-800 font-medium rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl group-hover:shadow-blue-500/25"
                    >
                      <span>서비스 이동</span>
                      <svg
                        className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}

            {/* 서비스가 없을 때 (인증된 사용자) */}
            {isAuthenticated &&
              visibleServices.length === 0 &&
              !servicesLoading &&
              !servicesError && (
                <div className="col-span-full text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors duration-200">
                    <svg
                      className="w-12 h-12 text-gray-400 dark:text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    접근 가능한 서비스가 없습니다
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">현재 권한으로 이용 가능한 서비스가 없습니다.</p>
                </div>
              )}
          </div>
        )}

        {/* 미인증 사용자용 안내 */}
        {!isAuthenticated && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors duration-200">
              <svg
                className="w-12 h-12 text-blue-500 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">로그인이 필요합니다</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">서비스를 이용하려면 로그인하세요.</p>
            <button
              onClick={handleLogin}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-400 to-indigo-400 text-gray-800 font-medium rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              로그인하기
            </button>
          </div>
        )}
      </main>
    </div>
    </SimpleLayout>
  );
}
