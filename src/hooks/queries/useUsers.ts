import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import type { UserSearchQuery } from '@krgeobuk/user';
import { queryKeys } from './keys';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useUsers(query: UserSearchQuery = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(query),
    queryFn: () => userService.getUsers(query),
    staleTime: 2 * 60 * 1000,
  });
}
