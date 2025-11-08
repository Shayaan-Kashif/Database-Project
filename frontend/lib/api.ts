/**
 * Helper function to get the access token from cookies
 */
function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'access_token') {
      return value;
    }
  }
  return null;
}

/**
 * Makes an authenticated API request to the backend
 * Automatically includes the JWT token in the Authorization header
 * and includes credentials for cookies
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();
  
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  // Add Authorization header if token exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Automatically sends cookies (refresh_token)
  });
}

