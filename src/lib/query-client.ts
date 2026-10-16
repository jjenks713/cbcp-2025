import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './api';

// One cache for the whole app (see App.tsx). Data is reused across pages
// for a few minutes before being refetched in the background, which suits
// Contentful content that changes rarely. Admin edits update or invalidate
// the affected queries themselves (hooks/queries/admin.ts).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      // Retry network blips once, but never auth/permission/validation
      // errors - those won't fix themselves.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 1;
      },
    },
  },
});
