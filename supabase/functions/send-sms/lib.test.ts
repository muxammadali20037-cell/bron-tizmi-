import { describe, expect, it } from "vitest";
import {
  buildSmsText,
  DEFAULT_SMS_TEMPLATE,
  hookError,
  parseHookSecrets,
  toEskizPhone,
  toUzE164,
} from "./lib";

describe("toUzE164", () => {
  it("Supabase formatidagi raqamni E.164 ga keltiradi", () => {
    expect(toUzE164("998901234567")).toBe("+998901234567");
    expect(toUzE164("+998901234567")).toBe("+998901234567");
  });

  it.each([["12025550123"], ["99890123456"], ["998012345678"], [""], [null], [998901234567]])(
    "O‘zbekiston raqami bo‘lmasa rad etadi: %s",
    (value) => {
      expect(toUzE164(value)).toBeNull();
    },
  );
});

describe("buildSmsText", () => {
  it("shablonga kodni qo‘yadi", () => {
    expect(buildSmsText("Kod: {code}", "123456")).toBe("Kod: 123456");
  });

  it("shablon bo‘lmasa yoki {code} yo‘q bo‘lsa — standart matn", () => {
    expect(buildSmsText(undefined, "123456")).toBe(
      DEFAULT_SMS_TEMPLATE.replace("{code}", "123456"),
    );
    expect(buildSmsText("kodsiz matn", "123456")).toContain("123456");
  });

  it("kod noto‘g‘ri bo‘lsa — null", () => {
    expect(buildSmsText(undefined, "12ab56")).toBeNull();
    expect(buildSmsText(undefined, undefined)).toBeNull();
  });
});

describe("yordamchilar", () => {
  it("Eskiz uchun + olib tashlanadi", () => {
    expect(toEskizPhone("+998901234567")).toBe("998901234567");
  });

  it("hook xatosi Supabase formatida", () => {
    expect(hookError(429, "too_many_attempts")).toEqual({
      status: 429,
      body: '{"error":{"http_code":429,"message":"too_many_attempts"}}',
    });
  });

  it("bir nechta kalitni ajratadi", () => {
    expect(parseHookSecrets("v1,whsec_abc|v1,whsec_def")).toEqual(["abc", "def"]);
    expect(parseHookSecrets(undefined)).toEqual([]);
  });
});
