import { useAuthStore } from '@/store/authStore';
import { useAuthInitialize } from '@/hooks/queries/auth';

export const useAuth = (): {
  user: { id: string; email?: string; name?: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
} => {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const initQuery = useAuthInitialize({ enabled: !isInitialized });

  return {
    user: initQuery.data?.user ?? null,
    isAuthenticated,
    isLoading: initQuery.isPending,
    error: initQuery.error ? String(initQuery.error) : null,
    isInitialized,
  };
};

export default useAuth;
