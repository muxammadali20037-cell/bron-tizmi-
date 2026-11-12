import { NextResponse, type NextRequest } from "next/server";
import { loginPath } from "@/lib/auth/next-path";
import { LOCALE_COOKIE } from "@/lib/i18n/config";
import { getLocaleFromPathname, pickLocale } from "@/lib/i18n/routing";
import { updateSession } from "@/lib/supabase/proxy";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Faqat kirgan foydalanuvchi ochadigan bo‘limlar (tilidan keyingi birinchi qism). */
const PROTECTED_SECTIONS = new Set(["profile", "onboarding", "os", "admin"]);

/**
 * Har bir sahifa so‘rovidan oldin ishlaydi:
 * - tilsiz manzilni (/discover) mos tilga yo‘naltiradi (/uz/discover);
 * - foydalanuvchi tanlagan tilni cookie'da eslab qoladi;
 * - Supabase sessiyasini yangilaydi;
 * - kirmagan foydalanuvchini himoyalangan bo‘limdan kirish sahifasiga yuboradi.
 *   (Bu tezkor yo‘naltirish; ruxsatning o‘zi sahifa, Server Action va RLS'da tekshiriladi.)
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const pathLocale = getLocaleFromPathname(pathname);

  if (!pathLocale) {
    const locale = pickLocale(
      request.cookies.get(LOCALE_COOKIE)?.value,
      request.headers.get("accept-language"),
    );
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const { response, isSignedIn } = await updateSession(request);

  const section = pathname.split("/")[2] ?? "";
  if (!isSignedIn && PROTECTED_SECTIONS.has(section)) {
    const url = request.nextUrl.clone();
    const target = new URL(loginPath(pathLocale, `${pathname}${search}`), url);
    const redirect = NextResponse.redirect(target);
    // Supabase eskirgan sessiya cookie'larini tozalagan bo‘lsa, buni ham brauzerga yetkazamiz
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  // Faqat haqiqiy sahifa ochilishida eslab qolamiz. Prefetch so‘rovlari (havolalar oldindan
  // yuklanishi) tanlovni o‘zgartirmasligi kerak — tugma bosilganda til switcher'ning o‘zi yozadi.
  const isDocumentRequest = request.headers.get("sec-fetch-dest") === "document";
  if (isDocumentRequest && request.cookies.get(LOCALE_COOKIE)?.value !== pathLocale) {
    response.cookies.set(LOCALE_COOKIE, pathLocale, {
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  matcher: [
    // API, Next.js ichki fayllari va kengaytmali statik fayllardan tashqari hamma sahifalar
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
