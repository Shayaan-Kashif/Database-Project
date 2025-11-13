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
 * Helper function to delete a cookie by name
 * Note: HttpOnly cookies (like refresh_token) cannot be deleted from frontend JavaScript
 */
function deleteCookie(name: string, path: string = '/') {
  if (typeof document === 'undefined') return;
  // Delete cookie by setting it to expire in the past
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
  // Also try without path
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Logs out the user by:
 * 1. Deleting client-side cookies (access_token if it exists)
 * 2. Redirecting to the login page
 * 
 * Note: The refresh_token cookie is HttpOnly and cannot be deleted from frontend.
 * It will expire naturally or can be cleared by the backend on next request.
 */
export function logout(): void {
  // Delete access_token cookie if it exists (client-side cookie)
  deleteCookie('access_token');
  
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
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

