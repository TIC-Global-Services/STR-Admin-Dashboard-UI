'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';
import { authApi } from '@/lib/api/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const setTokens = useAuthStore((state) => state.setTokens);

  useEffect(() => {
    const init = async () => {
      // Try to initialize from existing tokens
      initializeAuth();

      // If no tokens, auto-login
      const existingToken = localStorage.getItem('accessToken');
      if (!existingToken) {
        const response = await authApi.autoLogin();
        if (response) {
          setTokens(response.accessToken, response.refreshToken);
        }
      }
    };

    init();
  }, [initializeAuth, setTokens]);

  return <>{children}</>;
}
