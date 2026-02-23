import { useMutation } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import type { ChangePassword } from '@krgeobuk/user';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePassword) => userService.changePassword(data),
  });
}
