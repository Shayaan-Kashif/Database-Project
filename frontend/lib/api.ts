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
  // Try fallback path
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * LOGOUT FUNCTION
 * ----------------
 * - Calls backend /api/logout to clear the refresh token (HttpOnly cookie)
 * - Deletes client-side access_token
 * - Clears session data
 * - Redirects user to /login
 */
export async function logout(): Promise<void> {
  try {
    // 1️⃣ Tell backend to revoke the refresh token & clear cookie
    await fetch("http://localhost:8080/api/logout", {
      method: "POST",
      credentials: "include", // sends the HttpOnly refresh token
    });
  } catch (err) {
    console.error("Failed to call /api/logout:", err);
    // Still continue with client-side cleanup
  }

  // 2️⃣ Remove client-side access_token
  deleteCookie("access_token");
  deleteCookie("refresh_token");

  // 3️⃣ Clear sessionStorage
  sessionStorage.removeItem("name");
  sessionStorage.removeItem("role");

  // 4️⃣ Redirect user to login page
  if (typeof window !== "undefined") {
    window.location.href = "/login";
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
  headers.set("Content-Type", "application/json");

  // Add Authorization header if token exists
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include", // sends refresh_token
  });
}
