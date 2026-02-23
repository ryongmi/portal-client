import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useUserById(userId: string | null) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getUserById(userId!),
    enabled: !!userId,
  });
}
