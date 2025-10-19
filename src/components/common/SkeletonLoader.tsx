'use client';

import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  count = 1,
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  const variantClasses = {
    text: 'h-4 rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? undefined : '1rem'),
  };

  const skeletonElement = (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );

  if (count === 1) {
    return skeletonElement;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{skeletonElement}</div>
      ))}
    </div>
  );
};

// 미리 정의된 스켈레톤 레이아웃들
export const TableRowSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-12 bg-gray-100 rounded-lg mb-2 flex items-center px-4 space-x-4">
      <div className="h-4 bg-gray-200 rounded w-1/6"></div>
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/5"></div>
      <div className="h-4 bg-gray-200 rounded w-1/6"></div>
      <div className="h-4 bg-gray-200 rounded w-1/8"></div>
    </div>
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div className="animate-pulse bg-white rounded-lg p-6 shadow-sm border">
    <div className="flex items-center space-x-4 mb-4">
      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded w-full"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      <div className="h-3 bg-gray-200 rounded w-4/6"></div>
    </div>
    <div className="mt-4 flex justify-end">
      <div className="h-8 bg-gray-200 rounded w-20"></div>
    </div>
  </div>
);

export const FormSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-6">
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-1/6"></div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-1/5"></div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-24 bg-gray-200 rounded w-full"></div>
    </div>
    <div className="flex justify-end space-x-3">
      <div className="h-10 bg-gray-200 rounded w-20"></div>
      <div className="h-10 bg-gray-200 rounded w-20"></div>
    </div>
  </div>
);

/**
 * 서비스 카드 스켈레톤 - 메인 페이지 서비스 카드 로딩 시 사용
 * Dark mode 지원
 */
export const ServiceCardSkeleton: React.FC = () => (
  <div className="bg-white/85 dark:bg-gray-800/85 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 dark:border-gray-700/30 p-8 animate-pulse transition-colors duration-200">
    <div className="flex items-center space-x-4 mb-6">
      <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
      <div className="flex-1">
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
);

/**
 * 통계 카드 스켈레톤 - 메인 페이지 상단 통계 영역 로딩 시 사용
 * Dark mode 지원
 */
export const StatCardSkeleton: React.FC = () => (
  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 dark:border-gray-700/30 transition-colors duration-200 animate-pulse">
    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-12 mb-2"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
  </div>
);

export default SkeletonLoader;