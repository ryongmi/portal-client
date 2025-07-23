'use client';

import React, { useState } from 'react';
import { useAccessibility } from '@/hooks/useAccessibility';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import { FormField, Select, Checkbox } from '@/components/common/FormField';

interface AccessibilitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  isOpen,
  onClose,
}) => {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="접근성 설정"
      size="md"
      aria-label="접근성 설정 모달"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            시스템 감지 설정
          </h4>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p>
              <strong>동작 효과 감소:</strong> {systemPreferences.prefersReducedMotion ? '활성화됨' : '비활성화됨'}
            </p>
            <p>
              <strong>고대비 모드:</strong> {systemPreferences.prefersHighContrast ? '활성화됨' : '비활성화됨'}
            </p>
            <p>
              <strong>컬러 스키마:</strong> {systemPreferences.prefersColorScheme === 'dark' ? '다크 모드' : '라이트 모드'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <FormField
            label="글꼴 크기"
            hint="화면의 전체 글꼴 크기를 조정합니다"
          >
            <Select
              value={preferences.fontSize}
              onChange={(e) => setFontSize(e.target.value as 'small' | 'medium' | 'large')}
              options={fontSizeOptions}
              aria-label="글꼴 크기 선택"
            />
          </FormField>

          <FormField
            label="컬러 테마"
            hint="화면의 전체 색상 테마를 설정합니다"
          >
            <Select
              value={preferences.colorScheme}
              onChange={(e) => setColorScheme(e.target.value as 'light' | 'dark' | 'auto')}
              options={colorSchemeOptions}
              aria-label="컬러 테마 선택"
            />
          </FormField>

          <div className="space-y-3">
            <Checkbox
              label="고대비 모드 활성화"
              checked={preferences.highContrast}
              onChange={toggleHighContrast}
              aria-describedby="high-contrast-desc"
            />
            <p id="high-contrast-desc" className="text-sm text-gray-600 dark:text-gray-400 ml-6">
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
            <p id="reduced-motion-desc" className="text-sm text-gray-600 dark:text-gray-400 ml-6">
              애니메이션과 전환 효과를 최소화합니다.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
          <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
            📋 키보드 단축키
          </h4>
          <div className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
            <p><kbd className="px-2 py-1 bg-amber-200 dark:bg-amber-800 rounded">Tab</kbd> - 다음 요소로 이동</p>
            <p><kbd className="px-2 py-1 bg-amber-200 dark:bg-amber-800 rounded">Shift + Tab</kbd> - 이전 요소로 이동</p>
            <p><kbd className="px-2 py-1 bg-amber-200 dark:bg-amber-800 rounded">Enter</kbd> - 선택/실행</p>
            <p><kbd className="px-2 py-1 bg-amber-200 dark:bg-amber-800 rounded">Esc</kbd> - 모달 닫기</p>
            <p><kbd className="px-2 py-1 bg-amber-200 dark:bg-amber-800 rounded">Space</kbd> - 체크박스 토글</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            aria-label="접근성 설정 닫기"
          >
            닫기
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AccessibilitySettings;