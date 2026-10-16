import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { request, withAuth, ApiError } from './api';
import { queryKeys } from './query-keys';

export type AuthUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  address: string | null;
  // From the userRoles collection, e.g. ['admin', 'user']
  roles: Role[];
};

export type Role = 'user' | 'admin';

// Optional chaining covers an API not yet deployed with `roles`.
export const hasRole = (user: AuthUser | null | undefined, role: Role) => user?.roles?.includes(role) ?? false;

// The parts of their own account a user can edit (PATCH /api/auth/me).
export type ProfileUpdate = Partial<Pick<AuthUser, 'firstName' | 'lastName' | 'address'>>;

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (fields: ProfileUpdate) => Promise<void>;
};

const TOKEN_KEY = 'cbcp_auth_token';

const AuthContext = createContext<AuthContextValue | null>(null);

// The token lives in localStorage; the user it belongs to lives in the
// query cache (queryKeys.auth.me), fetched from /me whenever there's a
// token. Login/profile saves write the returned user straight into that
// cache entry, so there's no extra /me round trip after them.
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  const meQuery = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => request<{ user: AuthUser }>('/api/auth/me', { headers: withAuth(token) }).then((r) => r.user),
    enabled: Boolean(token),
  });

  // Drops everything tied to the current user - their profile and any
  // admin data - so nothing carries over to whoever logs in next.
  // Public site content stays cached.
  const clearUserData = useCallback(() => {
    queryClient.removeQueries({ queryKey: queryKeys.auth.all });
    queryClient.removeQueries({ queryKey: queryKeys.admin.all });
  }, [queryClient]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    clearUserData();
  }, [clearUserData]);

  // A stored token the API rejects (expired, user deleted) is useless -
  // forget it. Other failures (e.g. API unreachable) keep it for next time.
  useEffect(() => {
    if (meQuery.error instanceof ApiError && meQuery.error.status === 401) logout();
  }, [meQuery.error, logout]);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      request<{ token: string; user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    onSuccess: ({ token: newToken, user }) => {
      clearUserData();
      localStorage.setItem(TOKEN_KEY, newToken);
      queryClient.setQueryData(queryKeys.auth.me(), user);
      setToken(newToken);
    },
  });

  const profileMutation = useMutation({
    mutationFn: (fields: ProfileUpdate) =>
      request<{ user: AuthUser }>('/api/auth/me', {
        method: 'PATCH',
        headers: withAuth(token),
        body: JSON.stringify(fields),
      }).then((r) => r.user),
    onSuccess: (user) => queryClient.setQueryData(queryKeys.auth.me(), user),
  });

  const { mutateAsync: loginAsync } = loginMutation;
  const { mutateAsync: updateProfileAsync } = profileMutation;

  const login = useCallback(
    async (email: string, password: string) => {
      await loginAsync({ email, password });
    },
    [loginAsync]
  );

  const updateProfile = useCallback(
    async (fields: ProfileUpdate) => {
      await updateProfileAsync(fields);
    },
    [updateProfileAsync]
  );

  const user = token ? meQuery.data ?? null : null;
  // True while a stored token is still being checked, so routes can wait
  // instead of flashing "logged out" before /me resolves.
  const loading = Boolean(token) && meQuery.isPending;

  const value = useMemo(
    () => ({ user, token, loading, login, logout, updateProfile }),
    [user, token, loading, login, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ApiError };
