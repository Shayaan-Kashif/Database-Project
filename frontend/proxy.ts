import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect root → login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const publicRoutes = ["/login", "/signup"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Public pages don't need auth
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check for ACCESS token
  const accessToken = request.cookies.get("access_token")?.value;

  // ⭐ If access token exists, allow page to load
  if (accessToken) {
    return NextResponse.next();
  }

  // ⭐ If no access token, attempt to refresh
  try {
    const refreshResponse = await fetch("http://localhost:8080/api/refresh", {
      method: "POST",
      credentials: "include",
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });

    // Refresh failed → redirect to login
    if (!refreshResponse.ok) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ⭐ Refresh succeeded → extract new token
    const data = await refreshResponse.json();
    const newAccessToken = data?.access_token;

    if (!newAccessToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ⭐ Attach the new JWT as a Set-Cookie response header
    const response = NextResponse.next();
    response.cookies.set("access_token", newAccessToken, {
      path: "/",
      maxAge: 900, // match 15 minute expiry
      sameSite: "lax",
    });

    return response;
  } catch (err) {
    console.error("REFRESH ERROR:", err);

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/((?!api|login.*|signup.*|dashboard.*|map.*|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg)$).*)",
  ],
};