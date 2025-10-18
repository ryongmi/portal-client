'use client';

import SimpleLayout from '@/components/layout/SimpleLayout';
import { UserProfileCard } from '@/components/profile/UserProfileCard';

/**
 * 프로필 페이지
 * - 사용자 기본 정보 표시
 * - OAuth 인증 상태
 * - 역할 및 권한 정보
 * - 사용 가능한 서비스 목록
 */
export default function ProfilePage(): JSX.Element {
  return (
    <SimpleLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 페이지 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              프로필 설정
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              계정 정보와 권한을 확인하고 관리할 수 있습니다.
            </p>
          </div>

          {/* 프로필 카드 */}
          <UserProfileCard />
        </main>
      </div>
    </SimpleLayout>
  );
}
