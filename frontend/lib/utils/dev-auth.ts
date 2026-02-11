/**
 * Development utility to manually set auth tokens
 * Usage: Open browser console and run:
 * 
 * localStorage.setItem('accessToken', 'YOUR_TOKEN_HERE');
 * localStorage.setItem('refreshToken', 'YOUR_REFRESH_TOKEN_HERE');
 * window.location.reload();
 */

export function setDevToken(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  
  console.log('✅ Tokens set! Reloading page...');
  window.location.reload();
}

// Make it available globally in dev mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).setDevToken = setDevToken;
}
