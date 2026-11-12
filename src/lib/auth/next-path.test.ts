import { describe, expect, it } from "vitest";
import { loginPath, safeNextPath } from "./next-path";

describe("safeNextPath", () => {
  it("ichki sahifani qabul qiladi", () => {
    expect(safeNextPath("/uz/os", "uz")).toBe("/uz/os");
    expect(safeNextPath("/ru/os/abc/staff?tab=invites", "uz")).toBe("/ru/os/abc/staff?tab=invites");
  });

  it.each([
    [null],
    [undefined],
    [""],
    ["https://evil.example/uz"],
    ["//evil.example/uz"],
    ["/\\evil.example"],
    ["javascript:alert(1)"],
    ["uz/os"],
    ["/de/os"],
    ["/os"],
    ["/uz/os\nSet-Cookie: x=1"],
    ["/uz/login"],
    ["/uz/login?next=/uz/os"],
    ["/" + "a".repeat(600)],
  ])("xavfli yoki yaroqsiz qiymatni rad etadi: %s", (raw) => {
    expect(safeNextPath(raw, "uz")).toBe("/uz");
  });

  it("noto‘g‘ri qiymatda joriy tilga qaytaradi", () => {
    expect(safeNextPath("https://evil.example", "en")).toBe("/en");
  });
});

describe("loginPath", () => {
  it("qaytish joyini kodlaydi", () => {
    expect(loginPath("uz", "/uz/os?x=1")).toBe("/uz/login?next=%2Fuz%2Fos%3Fx%3D1");
  });

  it("yaroqsiz yoki bosh sahifa bo‘lsa next qo‘shmaydi", () => {
    expect(loginPath("ru")).toBe("/ru/login");
    expect(loginPath("ru", "https://evil.example")).toBe("/ru/login");
    expect(loginPath("ru", "/ru")).toBe("/ru/login");
  });
});
