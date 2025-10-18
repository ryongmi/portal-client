/**
 * 날짜 포맷팅 유틸리티 함수
 * 한국어 형식으로 날짜를 표시합니다
 */

/**
 * 날짜를 한국어 형식으로 포맷팅
 * @example "2024년 7월 15일"
 */
export const formatDate = (date: Date | string | undefined): string => {
  if (!date) return '알 수 없음';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // 유효하지 않은 날짜 체크
    if (isNaN(dateObj.getTime())) return '알 수 없음';

    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  } catch {
    return '알 수 없음';
  }
};

/**
 * 상대적 시간 표시 (예: "3개월 전 가입")
 * @example "3개월 전 가입", "1년 전 가입"
 */
export const getRelativeTime = (date: Date | string | undefined): string => {
  if (!date) return '알 수 없음';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // 유효하지 않은 날짜 체크
    if (isNaN(dateObj.getTime())) return '알 수 없음';

    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return '오늘 가입';
    if (days === 0) return '오늘 가입';
    if (days < 7) return `${days}일 전 가입`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `${weeks}주 전 가입`;
    }
    if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months}개월 전 가입`;
    }

    const years = Math.floor(days / 365);
    return `${years}년 전 가입`;
  } catch {
    return '알 수 없음';
  }
};

/**
 * 날짜를 간단한 형식으로 포맷팅
 * @example "2024.07.15"
 */
export const formatDateShort = (date: Date | string | undefined): string => {
  if (!date) return '알 수 없음';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // 유효하지 않은 날짜 체크
    if (isNaN(dateObj.getTime())) return '알 수 없음';

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}.${month}.${day}`;
  } catch {
    return '알 수 없음';
  }
};
