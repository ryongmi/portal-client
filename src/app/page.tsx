'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import Image from 'next/image';
import SimpleLayout from '@/components/layout/SimpleLayout';
import { ServiceCardSkeleton, StatCardSkeleton } from '@/components/common/SkeletonLoader';
import LoadingButton from '@/components/common/LoadingButton';

export default function Home(): JSX.Element {
  const { isAuthenticated } = useAuth();
  const { availableServices, loading: servicesLoading, error: servicesError } = useUserProfile();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // SSO 로그인 처리
  const handleLogin = (): void => {
    const returnUrl = typeof window !== 'undefined' ? window.location.pathname : '/';
    const redirectUri = encodeURIComponent(`${window.location.origin}${returnUrl}`);
    const ssoStartUrl = `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/auth/login?redirect_uri=${redirectUri}`;
    window.location.href = ssoStartUrl;
  };

  // 새로고침 처리
  const handleRefresh = (): void => {
    setIsRefreshing(true);
    window.location.reload();
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
              {isAuthenticated && servicesLoading ? (
                <>
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 dark:border-gray-700/30 transition-colors duration-200">
                    <div className="text-3xl font-bold text-blue-500 dark:text-blue-400 mb-2">
                      {visibleServices.length}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      사용 가능한 서비스
                    </div>
                  </div>
                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 dark:border-gray-700/30 transition-colors duration-200">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {visibleServices.filter((s) => !s.isVisibleByRole).length}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">공개 서비스</div>
                  </div>
                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 dark:border-gray-700/30 transition-colors duration-200">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                      {visibleServices.filter((s) => s.isVisibleByRole).length}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">권한 기반 서비스</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 서비스 카드 그리드 */}
          {/* 로딩 상태 */}
          {isAuthenticated && servicesLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, index) => (
                <ServiceCardSkeleton key={index} />
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
              <LoadingButton
                onClick={handleRefresh}
                isLoading={isRefreshing}
                loadingText="새로고침 중..."
                variant="primary"
                className="inline-flex items-center"
              >
                새로고침
              </LoadingButton>
            </div>
          )}

          {/* 정상 상태 - 서비스 목록 */}
          {(!isAuthenticated || (!servicesLoading && !servicesError)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {visibleServices.map((service, index) => {
                const requiresGoogleAuth = service.name?.includes('유튜브') || false;
                const hasBaseUrl = !!service.baseUrl;
                const isAccessible = hasBaseUrl && !requiresGoogleAuth;

                return (
                  <article
                    key={service.id}
                    className={`group relative min-h-[360px] bg-white/85 dark:bg-gray-800/85 backdrop-blur-sm rounded-2xl shadow-lg border-2 transition-all duration-300 overflow-hidden flex flex-col ${
                      isAccessible
                        ? 'border-white/30 dark:border-gray-700/30 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-2xl hover:scale-[1.02] cursor-pointer'
                        : 'border-gray-300 dark:border-gray-700 opacity-70 cursor-not-allowed'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => {
                      if (isAccessible && service.baseUrl) {
                        window.open(service.baseUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    tabIndex={isAccessible ? 0 : -1}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && isAccessible && service.baseUrl) {
                        e.preventDefault();
                        window.open(service.baseUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    role={isAccessible ? 'button' : 'article'}
                    aria-label={`${service.displayName || service.name} 서비스${
                      isAccessible ? ' - 클릭하여 열기' : ' - 접근 불가'
                    }`}
                  >
                    {/* 카드 배경 그라데이션 */}
                    {isAccessible && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 dark:from-blue-500/30 dark:to-indigo-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                      </>
                    )}

                    <div className="relative p-8 flex flex-col flex-1">
                      {/* 헤더 */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="relative flex-shrink-0">
                            {service.iconUrl ? (
                              <Image
                                src={service.iconUrl}
                                alt={(service.displayName || service.name) ?? ''}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-xl shadow-md"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
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
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                  />
                                </svg>
                              </div>
                            )}
                            {isAccessible && (
                              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-20 blur rounded-xl transition-opacity duration-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors duration-200 truncate">
                              {service.displayName || service.name}
                            </h3>
                          </div>
                        </div>

                        {/* 상태 배지 */}
                        <div className="flex-shrink-0 ml-2">
                          {isAccessible ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              접근 가능
                            </span>
                          ) : requiresGoogleAuth ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              인증 필요
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              준비 중
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 권한 유형 배지 */}
                      <div className="mb-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                            service.isVisibleByRole
                              ? 'bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-700 dark:text-orange-300'
                              : 'bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          <svg
                            className={`w-3 h-3 mr-1 ${
                              service.isVisibleByRole
                                ? 'text-orange-500 dark:text-orange-400'
                                : 'text-blue-500 dark:text-blue-400'
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
                          {service.isVisibleByRole ? '권한 기반' : '공개 서비스'}
                        </span>
                      </div>

                      {/* 설명 */}
                      <div className="flex-1 mb-6">
                        {service.description ? (
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm line-clamp-3 transition-colors duration-200">
                            {service.description}
                          </p>
                        ) : (
                          <p className="text-gray-400 dark:text-gray-500 italic text-sm">
                            서비스 설명이 없습니다
                          </p>
                        )}
                      </div>

                      {/* 푸터: URL 미리보기 및 액션 */}
                      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          {/* URL 미리보기 */}
                          {service.baseUrl ? (
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate mr-2 max-w-[60%]">
                              {new URL(service.baseUrl).hostname}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                              URL 미설정
                            </span>
                          )}

                          {/* 액션 버튼 */}
                          {isAccessible ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(
                                  service?.baseUrl ?? '/',
                                  '_blank',
                                  'noopener,noreferrer'
                                );
                              }}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                            >
                              <span>서비스 열기</span>
                              <svg
                                className="ml-2 h-4 w-4"
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
                            </button>
                          ) : requiresGoogleAuth ? (
                            <button
                              disabled
                              className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed"
                            >
                              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              인증 필요
                            </button>
                          ) : (
                            <button
                              disabled
                              className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed"
                            >
                              준비 중
                            </button>
                          )}
                        </div>

                        {/* 추가 안내 메시지 */}
                        {requiresGoogleAuth && (
                          <div className="mt-3 text-xs text-yellow-700 dark:text-yellow-300 flex items-start">
                            <svg
                              className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>이 서비스는 Google 계정 연결이 필요합니다</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}

              {/* 서비스가 없을 때 (인증된 사용자) */}
              {isAuthenticated &&
                visibleServices.length === 0 &&
                !servicesLoading &&
                !servicesError && (
                  <div className="col-span-full text-center py-20">
                    {/* 일러스트레이션 */}
                    <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
                      <svg
                        className="w-16 h-16 text-blue-500 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </div>

                    {/* 메시지 */}
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                      아직 이용 가능한 서비스가 없어요
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                      서비스 접근 권한이 필요합니다.
                      <br />
                      관리자에게 문의하여 필요한 서비스 권한을 요청해주세요.
                    </p>

                    {/* 액션 버튼 그룹 */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <a
                        href="mailto:support@krgeobuk.com?subject=서비스 접근 권한 요청"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
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
                        관리자에게 문의하기
                      </a>
                      <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        새로고침
                      </button>
                    </div>
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
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                로그인이 필요합니다
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                서비스를 이용하려면 로그인하세요.
              </p>
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
