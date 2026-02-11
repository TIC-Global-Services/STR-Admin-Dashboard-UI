import { apiClient } from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/login', credentials);
    return data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/refresh', { refreshToken });
    return data;
  },

  // Auto-login for development
  autoLogin: async (): Promise<AuthResponse | null> => {
    try {
      // Check if we already have a valid token
      const existingToken = localStorage.getItem('accessToken');
      if (existingToken) {
        return null; // Already logged in
      }

      // Auto-login with super admin credentials
      const response = await authApi.login({
        email: 'manojkumararumainathan@gmail.com',
        password: '12345678',
      });

      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);

      return response;
    } catch (error) {
      console.error('Auto-login failed:', error);
      return null;
    }
  },
};
