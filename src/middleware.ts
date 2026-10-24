import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { UNIT_COOKIE } from "@/lib/unit-cookie";

export async function middleware(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const isLogin = req.nextUrl.pathname === "/login";

  if (!session && !isLogin) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (session && isLogin) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  const res = NextResponse.next();
  // Lembra a última unidade escolhida, para a agenda e as telas de horários abrirem nela.
  const unit = req.nextUrl.searchParams.get("unidade");
  if (session && unit) res.cookies.set(UNIT_COOKIE, unit, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|marca/).*)"],
};
