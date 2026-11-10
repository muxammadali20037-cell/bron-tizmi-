import { describe, expect, it } from "vitest";
import { interpolate, plural, type PluralForms } from "./format";

describe("interpolate", () => {
  it("qiymatlarni joylaydi", () => {
    expect(interpolate("© 2026 {brand}", { brand: "SOFRIVA" })).toBe("© 2026 SOFRIVA");
    expect(interpolate("{a} va {b}", { a: 1, b: "ikki" })).toBe("1 va ikki");
  });

  it("noma’lum kalitga tegmaydi", () => {
    expect(interpolate("{x} {y}", { x: "bor" })).toBe("bor {y}");
  });

  it("prototip kalitlarini qiymat deb olmaydi", () => {
    expect(interpolate("{toString}", {})).toBe("{toString}");
  });
});

describe("plural", () => {
  const ru: PluralForms = {
    one: "{count} гость",
    few: "{count} гостя",
    many: "{count} гостей",
    other: "{count} гостя",
  };
  const en: PluralForms = {
    one: "{count} guest",
    few: "{count} guests",
    many: "{count} guests",
    other: "{count} guests",
  };
  const uz: PluralForms = {
    one: "{count} kishi",
    few: "{count} kishi",
    many: "{count} kishi",
    other: "{count} kishi",
  };

  it.each([
    [1, "1 гость"],
    [2, "2 гостя"],
    [4, "4 гостя"],
    [5, "5 гостей"],
    [11, "11 гостей"],
    [21, "21 гость"],
    [22, "22 гостя"],
  ])("ru %i", (count, expected) => {
    expect(plural("ru", count, ru)).toBe(expected);
  });

  it("en", () => {
    expect(plural("en", 1, en)).toBe("1 guest");
    expect(plural("en", 3, en)).toBe("3 guests");
  });

  it("uz", () => {
    expect(plural("uz", 1, uz)).toBe("1 kishi");
    expect(plural("uz", 6, uz)).toBe("6 kishi");
  });
});
