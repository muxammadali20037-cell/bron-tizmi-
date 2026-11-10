import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE } from "@/lib/i18n/config";
import { getLocaleFromPathname, pickLocale } from "@/lib/i18n/routing";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Har bir sahifa so‘rovidan oldin ishlaydi:
 * - tilsiz manzilni (/discover) mos tilga yo‘naltiradi (/uz/discover);
 * - foydalanuvchi tanlagan tilni cookie'da eslab qoladi.
 * Sprint 3'da shu yerga Supabase sessiyasini yangilash qo‘shiladi.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathLocale = getLocaleFromPathname(pathname);

  if (pathLocale) {
    const response = NextResponse.next();
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

  const locale = pickLocale(
    request.cookies.get(LOCALE_COOKIE)?.value,
    request.headers.get("accept-language"),
  );
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // API, Next.js ichki fayllari va kengaytmali statik fayllardan tashqari hamma sahifalar
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
