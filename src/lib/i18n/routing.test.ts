import { describe, expect, it } from "vitest";
import {
  getLocaleFromPathname,
  negotiateLocale,
  pickLocale,
  switchLocaleInPathname,
} from "./routing";

describe("getLocaleFromPathname", () => {
  it("URL'dagi tilni topadi", () => {
    expect(getLocaleFromPathname("/ru")).toBe("ru");
    expect(getLocaleFromPathname("/en/discover")).toBe("en");
    expect(getLocaleFromPathname("/uz/r/navvat/book")).toBe("uz");
  });

  it("til bo‘lmasa null qaytaradi", () => {
    expect(getLocaleFromPathname("/")).toBeNull();
    expect(getLocaleFromPathname("/discover")).toBeNull();
    expect(getLocaleFromPathname("/fr/discover")).toBeNull();
    // "/ru" bilan boshlanadigan, lekin til bo‘lmagan segment
    expect(getLocaleFromPathname("/russia")).toBeNull();
  });
});

describe("negotiateLocale", () => {
  it("brauzer tilini mos tilga moslaydi", () => {
    expect(negotiateLocale("ru-RU,ru;q=0.9,en;q=0.8")).toBe("ru");
    expect(negotiateLocale("en-US,en;q=0.9")).toBe("en");
    expect(negotiateLocale("uz-Latn-UZ,uz;q=0.9,ru;q=0.8")).toBe("uz");
  });

  it("qo‘llab-quvvatlanmaydigan til uchun keyingi mos tilni oladi", () => {
    expect(negotiateLocale("de-DE,de;q=0.9,ru;q=0.5")).toBe("ru");
  });

  it("mos til bo‘lmasa yoki sarlavha buzuq bo‘lsa o‘zbekchaga qaytadi", () => {
    expect(negotiateLocale(null)).toBe("uz");
    expect(negotiateLocale("")).toBe("uz");
    expect(negotiateLocale("*")).toBe("uz");
    expect(negotiateLocale("de-DE,fr;q=0.8")).toBe("uz");
    expect(negotiateLocale("!!!,@@@")).toBe("uz");
  });
});

describe("pickLocale", () => {
  it("saqlangan tanlov brauzer tilidan ustun", () => {
    expect(pickLocale("en", "ru-RU")).toBe("en");
  });

  it("cookie noto‘g‘ri bo‘lsa brauzer tiliga o‘tadi", () => {
    expect(pickLocale("xx", "ru-RU")).toBe("ru");
    expect(pickLocale(undefined, null)).toBe("uz");
  });
});

describe("switchLocaleInPathname", () => {
  it("tilni almashtiradi, qolgan yo‘lni saqlaydi", () => {
    expect(switchLocaleInPathname("/ru/discover", "uz")).toBe("/uz/discover");
    expect(switchLocaleInPathname("/uz", "en")).toBe("/en");
    expect(switchLocaleInPathname("/en/r/navvat/book", "ru")).toBe("/ru/r/navvat/book");
  });

  it("tilsiz yo‘lga til qo‘shadi", () => {
    expect(switchLocaleInPathname("/", "ru")).toBe("/ru");
    expect(switchLocaleInPathname("/discover", "en")).toBe("/en/discover");
  });
});
