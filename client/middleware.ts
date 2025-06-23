import { NextResponse } from "next/server";
import { auth } from "./auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Protect /devx routes
  if (pathname.startsWith("/devx") && !req.auth) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  // Redirect authenticated users away from auth page
  if (pathname.startsWith("/auth") && req.auth) {
    return NextResponse.redirect(new URL("/devx", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
