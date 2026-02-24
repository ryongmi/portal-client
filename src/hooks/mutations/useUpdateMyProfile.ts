import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import type { UpdateMyProfile } from '@krgeobuk/user';
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
