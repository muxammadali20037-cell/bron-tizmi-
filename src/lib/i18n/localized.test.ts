import { describe, expect, it } from "vitest";
import { pickLocalized } from "./localized";

describe("pickLocalized", () => {
  const name = { uz: "Oqtepa", ru: "Октепа", en: "" };

  it("so‘ralgan tilni qaytaradi", () => {
    expect(pickLocalized(name, "ru")).toBe("Октепа");
    expect(pickLocalized(name, "uz")).toBe("Oqtepa");
  });

  it("bo‘sh bo‘lsa boshqa tilga o‘tadi", () => {
    expect(pickLocalized(name, "en")).toBe("Oqtepa");
    expect(pickLocalized({ ru: "Только русский" }, "uz")).toBe("Только русский");
  });

  it("noto‘g‘ri qiymatda bo‘sh satr", () => {
    expect(pickLocalized(null, "uz")).toBe("");
    expect(pickLocalized("matn", "uz")).toBe("");
    expect(pickLocalized(["uz"], "uz")).toBe("");
    expect(pickLocalized({ uz: 5 }, "uz")).toBe("");
  });
});
