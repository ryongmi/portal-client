import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/store/authStore';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useDeleteMyAccount() {
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: () => userService.deleteMyAccount(),
    onSuccess: (): void => {
      clearAuth();
      queryClient.clear();
    },
  });
}
