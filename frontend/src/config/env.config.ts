export const env = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000'
};

// Compile-time check to ensure no server-only secrets leak into frontend environment configuration
if (typeof window !== 'undefined') {
  if ('JWT_SECRET' in process.env || 'DATABASE_URL' in process.env) {
    console.warn('⚠️ [SECURITY WARNING] Server-side secret detected in browser process.env context!');
  }
}
