import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import type { UpdateMyProfile, ChangePassword } from '@krgeobuk/user';
import { queryKeys } from '@/hooks/queries/keys';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateMyProfile) => userService.updateMyProfile(data),
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.myProfile() });
    },
  });
}

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

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePassword) => userService.changePassword(data),
  });
}
