import { NextResponse, type NextRequest } from "next/server";
import { trackClick } from "@/lib/store";

/** Creator links: /r/CODE?to=/product/slug — records the click and sets attribution. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const to = req.nextUrl.searchParams.get("to") ?? "/";
  // Only same-site relative paths, to avoid an open redirect.
  const dest = to.startsWith("/") && !to.startsWith("//") ? to : "/";
  const res = NextResponse.redirect(new URL(dest, req.url));
  const affiliate = trackClick(code);
  if (affiliate) {
    res.cookies.set("pm_ref", affiliate.code, {
      path: "/",
      maxAge: affiliate.windowDays * 86_400,
      sameSite: "lax",
      httpOnly: true,
    });
  }
  return res;
}
