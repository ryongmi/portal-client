'use client';

import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { formatDate, getRelativeTime } from '@/utils/dateFormat';

import type { OAuthAccountProviderType } from '@krgeobuk/shared/oauth';
import Image from 'next/image';

interface OAuthBadgeProps {
  provider: OAuthAccountProviderType;
}

const OAuthBadge: React.FC<OAuthBadgeProps> = ({ provider }) => {
  const badgeConfig = {
    google: {
      label: 'Google',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-800 dark:text-red-300',
      icon: '🔍',
    },
    naver: {
      label: 'Naver',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-800 dark:text-green-300',
      icon: 'N',
    },
    homePage: {
      label: 'Homepage',
      bgColor: 'bg-gray-100 dark:bg-gray-700',
      textColor: 'text-gray-800 dark:text-gray-300',
      icon: '🏠',
    },
  };

  const config = badgeConfig[provider];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} transition-colors duration-200`}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
};

interface ServiceCardProps {
  service: {
    id: string;
    name?: string;
    description?: string | null;
    baseUrl?: string | null;
    displayName?: string | null;
    iconUrl?: string | null;
  };
  hasGoogleAuth: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, hasGoogleAuth }) => {
  const requiresGoogleAuth = service.name?.includes('유튜브') || false;
  const isAccessible = !requiresGoogleAuth || hasGoogleAuth;

  const handleServiceOpen = (e: React.MouseEvent): void => {
    if (!isAccessible || !service.baseUrl) return;

    e.preventDefault();
    window.open(service.baseUrl, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if ((e.key === 'Enter' || e.key === ' ') && isAccessible && service.baseUrl) {
      e.preventDefault();
      window.open(service.baseUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      onClick={handleServiceOpen}
      onKeyDown={handleKeyDown}
      tabIndex={isAccessible && service.baseUrl ? 0 : -1}
      role={isAccessible && service.baseUrl ? 'button' : 'article'}
      aria-label={`${service.displayName || service.name} 서비스${
        isAccessible ? ' - 클릭하여 열기' : ' - 접근 불가'
      }`}
      className={`min-h-[200px] p-6 rounded-xl border-2 transition-all duration-200 flex flex-col ${
        isAccessible && service.baseUrl
          ? 'bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-900/10 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl hover:scale-[1.02] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900'
          : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 opacity-60 cursor-not-allowed'
      }`}
    >
      {/* 상단: 아이콘 및 상태 배지 */}
      <div className="flex items-start justify-between mb-4">
        {service.iconUrl ? (
          <div className="flex-shrink-0">
            <Image
              src={service.iconUrl}
              alt={`${service.name} icon`}
              width={48}
              height={48}
              className="w-12 h-12 rounded-lg shadow-sm"
            />
          </div>
        ) : (
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center shadow-sm">
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

        {/* 상태 배지 */}
        <div className="flex-shrink-0">
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
          ) : (
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
          )}
        </div>
      </div>

      {/* 중앙: 서비스 정보 */}
      <div className="flex-1">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {service.displayName || service.name || 'Unknown Service'}
        </h4>
        {service.description ? (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {service.description}
          </p>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">서비스 설명이 없습니다</p>
        )}
      </div>

      {/* 하단: 액션 영역 */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {requiresGoogleAuth && !hasGoogleAuth ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
              ⚠️ Google 계정 연결 필요
            </span>
            <button
              disabled
              className="px-3 py-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-not-allowed"
            >
              접근 불가
            </button>
          </div>
        ) : service.baseUrl ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate mr-2">
              {new URL(service.baseUrl).hostname}
            </span>
            <button
              onClick={handleServiceOpen}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors duration-200 flex items-center space-x-1"
            >
              <span>서비스 열기</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </button>
          </div>
        ) : (
          <div className="text-xs text-gray-400 dark:text-gray-500 italic">
            서비스 URL이 설정되지 않았습니다
          </div>
        )}
      </div>
    </div>
  );
};

export const UserProfileCard: React.FC = () => {
  const {
    userProfile,
    loading,
    error,
    hasGoogleAuth,
    hasNaverAuth,
    isHomepageUser,
    availableServices,
    // roles,
    // permissions,
  } = useUserProfile();

  if (loading) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 transition-colors duration-200">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            프로필 정보를 불러오는 중...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 transition-colors duration-200">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 transition-colors duration-200">
        <ErrorMessage message="사용자 프로필을 찾을 수 없습니다." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 기본 사용자 정보 */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 transition-colors duration-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {userProfile.name}
              </h2>
              <OAuthBadge provider={userProfile.oauthAccount.provider || 'google'} />
            </div>

            <p className="text-gray-600 dark:text-gray-400 mt-1">{userProfile.email}</p>

            {userProfile.nickname && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                닉네임: {userProfile.nickname}
              </p>
            )}

            {/* 가입일 정보 */}
            {userProfile.createdAt && (
              <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>{formatDate(userProfile.createdAt)} 가입</span>
                <span className="text-gray-400 dark:text-gray-500">·</span>
                <span>{getRelativeTime(userProfile.createdAt)}</span>
              </div>
            )}

            <div className="flex items-center space-x-4 mt-4">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200 ${
                  userProfile.isEmailVerified
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                }`}
              >
                {userProfile.isEmailVerified ? '✓ 이메일 인증됨' : '⚠️ 이메일 미인증'}
              </span>

              {userProfile.isIntegrated && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 transition-colors duration-200">
                  🔗 통합 계정
                </span>
              )}
            </div>
          </div>

          {userProfile.profileImageUrl && (
            <div className="ml-6">
              <Image
                src={userProfile.profileImageUrl}
                alt={`${userProfile.name} 프로필`}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* 권한 정보 - 나중에 필요할 경우 주석 해제 */}
      {/* <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">권한 정보</h3>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">역할 ({roles.length}개)</h4>
            {roles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {roles.map((role, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {role}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">할당된 역할이 없습니다.</p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              권한 ({permissions.length}개)
            </h4>
            {permissions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {permissions.map((permission, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">할당된 권한이 없습니다.</p>
            )}
          </div>
        </div>
      </div> */}

      {/* 사용 가능한 서비스 */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 transition-colors duration-200">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          사용 가능한 서비스 ({availableServices.length}개)
        </h3>

        {availableServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableServices.map((service) => (
              <ServiceCard key={service.id} service={service} hasGoogleAuth={hasGoogleAuth} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            {/* 일러스트레이션 */}
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
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
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>

            {/* 메시지 */}
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              아직 이용 가능한 서비스가 없어요
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              서비스 접근 권한이 필요합니다. 관리자에게 문의하여 필요한 서비스 권한을 요청해주세요.
            </p>

            {/* 액션 버튼 */}
            <a
              href="mailto:support@krgeobuk.com?subject=서비스 접근 권한 요청"
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              관리자에게 문의하기
            </a>
          </div>
        )}
      </div>

      {/* OAuth 인증 상태 */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 transition-colors duration-200">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">인증 상태</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Google 인증</span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200 ${
                hasGoogleAuth
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
              }`}
            >
              {hasGoogleAuth ? '✓ 연결됨' : '연결 안됨'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Naver 인증</span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200 ${
                hasNaverAuth
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
              }`}
            >
              {hasNaverAuth ? '✓ 연결됨' : '연결 안됨'}
            </span>
          </div>

          {isHomepageUser && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors duration-200">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                💡 추가 서비스 이용을 위해 Google 또는 Naver 계정을 연결해보세요.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
