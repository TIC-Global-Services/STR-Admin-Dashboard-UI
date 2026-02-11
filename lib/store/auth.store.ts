import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
}

interface AuthState {
  user: JwtPayload | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  setTokens: (accessToken: string, refreshToken: string) => {
    try {
      const decoded = jwtDecode<JwtPayload>(accessToken);
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      set({
        user: decoded,
        accessToken,
        refreshToken,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
  },

  clearAuth: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  hasPermission: (permission: string) => {
    const { user } = get();
    if (!user) return false;
    
    // SUPER_ADMIN has all permissions
    if (user.roles.includes('SUPER_ADMIN')) return true;
    
    return user.permissions.includes(permission);
  },

  hasRole: (role: string) => {
    const { user } = get();
    return user?.roles.includes(role) || false;
  },

  initializeAuth: () => {
    if (typeof window === 'undefined') return;
    
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (accessToken && refreshToken) {
      try {
        const decoded = jwtDecode<JwtPayload>(accessToken);
        
        // Check if token is expired
        if (decoded.exp * 1000 > Date.now()) {
          set({
            user: decoded,
            accessToken,
            refreshToken,
            isAuthenticated: true,
          });
        } else {
          get().clearAuth();
        }
      } catch (error) {
        get().clearAuth();
      }
    }
  },
}));
