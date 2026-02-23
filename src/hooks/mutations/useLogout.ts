import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useLogout() {
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: (): void => {
      clearAuth();
      void queryClient.invalidateQueries({ queryKey: ['authInitialize'] });
      void queryClient.removeQueries({ queryKey: ['myProfile'] });
    },
    onError: (): void => {
      // 실패해도 클라이언트 상태 초기화
      clearAuth();
    },
  });
}
