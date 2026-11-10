import { describe, expect, it } from "vitest";
import {
  applyPhoneEdit,
  caretAfterDigit,
  formatE164ForDisplay,
  formatNationalPhone,
  isValidNationalPhone,
  normalizeUzPhone,
} from "./phone";

describe("formatNationalPhone", () => {
  it.each([
    ["", ""],
    ["9", "9"],
    ["90", "90"],
    ["901", "90 1"],
    ["90123", "90 123"],
    ["901234", "90 123 4"],
    ["9012345", "90 123 45"],
    ["901234567", "90 123 45 67"],
    ["9012345678", "90 123 45 67"],
  ])("%s → %s", (input, expected) => {
    expect(formatNationalPhone(input)).toBe(expected);
  });
});

describe("normalizeUzPhone", () => {
  it.each([
    ["901234567", "+998901234567"],
    ["90 123 45 67", "+998901234567"],
    ["+998 90 123 45 67", "+998901234567"],
    ["998901234567", "+998901234567"],
    ["+998 (71) 200-00-00", "+998712000000"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeUzPhone(input)).toBe(expected);
  });

  it.each(["", "12345", "90123456", "9012345678", "012345678", "+7 901 234 56 78", "abc"])(
    "%s rad etiladi",
    (input) => {
      expect(normalizeUzPhone(input)).toBeNull();
    },
  );
});

describe("isValidNationalPhone", () => {
  it("9 ta raqam, 0 bilan boshlanmaydi", () => {
    expect(isValidNationalPhone("901234567")).toBe(true);
    expect(isValidNationalPhone("012345678")).toBe(false);
    expect(isValidNationalPhone("90123456")).toBe(false);
  });
});

describe("formatE164ForDisplay", () => {
  it("chiroyli ko‘rinish beradi", () => {
    expect(formatE164ForDisplay("+998901234567")).toBe("+998 90 123 45 67");
  });
  it("noto‘g‘ri qiymatni o‘zgartirmaydi", () => {
    expect(formatE164ForDisplay("+7123")).toBe("+7123");
  });
});

describe("caretAfterDigit", () => {
  it("bo‘shliqlarni hisobga oladi", () => {
    expect(caretAfterDigit("90 123 45 67", 0)).toBe(0);
    expect(caretAfterDigit("90 123 45 67", 2)).toBe(2);
    expect(caretAfterDigit("90 123 45 67", 3)).toBe(4);
    expect(caretAfterDigit("90 123 45 67", 9)).toBe(12);
  });
});

describe("applyPhoneEdit", () => {
  it("oddiy yozish", () => {
    expect(applyPhoneEdit({ previousDigits: "90", rawValue: "901", caret: 3 })).toEqual({
      digits: "901",
      caret: 4,
    });
  });

  it("to‘liq xalqaro raqamni joylashtirish (paste)", () => {
    expect(
      applyPhoneEdit({ previousDigits: "", rawValue: "+998 90 123 45 67", caret: 17 }),
    ).toEqual({ digits: "901234567", caret: 12 });
  });

  it("998 dan boshlab harfma-harf yozilgan raqam to‘g‘ri chiqadi", () => {
    let digits = "";
    let raw = "";
    for (const char of "+998 90 123 45 67") {
      raw = formatNationalPhone(digits) + char;
      digits = applyPhoneEdit({ previousDigits: digits, rawValue: raw, caret: raw.length }).digits;
    }
    expect(digits).toBe("901234567");
  });

  it("998 bilan boshlanadigan milliy raqamga tegmaydi", () => {
    expect(applyPhoneEdit({ previousDigits: "99", rawValue: "998", caret: 3 }).digits).toBe("998");
  });

  it("bo‘shliqdan keyin Backspace oldingi raqamni o‘chiradi", () => {
    // "90 |123" → Backspace bo‘shliqni o‘chirdi → "90|123"
    expect(
      applyPhoneEdit({
        previousDigits: "90123",
        rawValue: "90123",
        caret: 2,
        deletion: "backward",
      }),
    ).toEqual({ digits: "9123", caret: 1 });
  });

  it("bo‘shliq oldidan Delete keyingi raqamni o‘chiradi", () => {
    // "90| 123" → Delete bo‘shliqni o‘chirdi → "90|123"
    expect(
      applyPhoneEdit({
        previousDigits: "90123",
        rawValue: "90123",
        caret: 2,
        deletion: "forward",
      }),
    ).toEqual({ digits: "9023", caret: 2 });
  });

  it("oddiy raqamni o‘chirish", () => {
    expect(
      applyPhoneEdit({
        previousDigits: "90123",
        rawValue: "90 12",
        caret: 5,
        deletion: "backward",
      }),
    ).toEqual({ digits: "9012", caret: 5 });
  });

  it("raqam to‘lganda ortiqcha belgi qabul qilinmaydi", () => {
    expect(
      applyPhoneEdit({ previousDigits: "901234567", rawValue: "90 1235 45 67", caret: 7 }),
    ).toEqual({ digits: "901234567", caret: 6 });
  });

  it("harflar e’tiborsiz qoldiriladi", () => {
    expect(applyPhoneEdit({ previousDigits: "90", rawValue: "90a", caret: 3 })).toEqual({
      digits: "90",
      caret: 2,
    });
  });
});
