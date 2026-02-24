export const queryKeys = {
  auth: {
    all: () => ['auth'] as const,
    initialize: () => ['auth', 'initialize'] as const,
    myProfile: () => ['auth', 'myProfile'] as const,
  },
  users: {
    all: () => ['users'] as const,
    list: (query?: object) => ['users', 'list', query] as const,
    detail: (id: string | null) => ['users', 'detail', id] as const,
  },
} as const;
