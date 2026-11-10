"use client";

import { useEffect } from "react";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import boundary from "@/messages/boundary.json";

/**
 * Asosiy layout'ning o‘zida xato bo‘lsa ko‘rinadi. Bu sahifa global CSS'siz chiziladi,
 * shuning uchun uslublar shu yerda yozilgan.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const firstSegment =
    typeof window === "undefined" ? undefined : window.location.pathname.split("/")[1];
  const locale = isLocale(firstSegment) ? firstSegment : defaultLocale;
  const copy = boundary[locale];

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={locale}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8F7F4",
          color: "#1F2937",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          padding: 20,
          textAlign: "center",
        }}
      >
        <main style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: 20, margin: "0 0 12px" }}>{copy.title}</h1>
          <p style={{ color: "#5C6370", lineHeight: 1.6, margin: "0 0 20px" }}>
            {copy.description}
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              height: 44,
              padding: "0 20px",
              border: "none",
              borderRadius: 12,
              background: "#0F3D34",
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {copy.retry}
          </button>
        </main>
      </body>
    </html>
  );
}
