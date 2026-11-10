import { describe, expect, it } from "vitest";
import en from "./en.json";
import ru from "./ru.json";
import uz from "./uz.json";

/** Obyektning barcha kalitlarini "home.customers.items[0]" ko‘rinishida yig‘adi. */
function collectPaths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectPaths(item, `${prefix}[${index}]`));
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      collectPaths(child, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [prefix];
}

function collectEmpty(value: unknown, prefix = ""): string[] {
  return collectPaths(value, prefix).filter((path) => {
    const leaf = path
      .split(/\.|\[|\]/)
      .filter(Boolean)
      .reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], value);
    return typeof leaf !== "string" || leaf.trim() === "";
  });
}

describe("tarjima fayllari", () => {
  const base = collectPaths(uz).sort();

  it.each([
    ["ru", ru],
    ["en", en],
  ])("%s fayli o‘zbekcha bilan bir xil kalitlarga ega", (_name, dict) => {
    expect(collectPaths(dict).sort()).toEqual(base);
  });

  it.each([
    ["uz", uz],
    ["ru", ru],
    ["en", en],
  ])("%s faylida bo‘sh matn yo‘q", (_name, dict) => {
    expect(collectEmpty(dict)).toEqual([]);
  });
});

describe("xato sahifasi matnlari (boundary.json)", () => {
  it("uchala tilda bir xil kalitlar va bo‘sh matn yo‘q", async () => {
    const boundary = (await import("./boundary.json")).default;
    const base = collectPaths(boundary.uz).sort();
    for (const locale of ["ru", "en"] as const) {
      expect(collectPaths(boundary[locale]).sort()).toEqual(base);
    }
    for (const locale of ["uz", "ru", "en"] as const) {
      expect(collectEmpty(boundary[locale])).toEqual([]);
    }
  });
});
