import { describe, expect, it } from "vitest";
import {
  filterBookableSlots,
  generateSlotStarts,
  groupSlotsByPeriod,
  type SlotRule,
} from "./slots";
import { formatTimeOfDay, parseTimeOfDay, tashkentClock } from "./time";

const rule = (overrides: Partial<SlotRule> = {}): SlotRule => ({
  opensAt: "10:00",
  closesAt: "23:00",
  intervalMinutes: 30,
  lastSeatingBeforeCloseMinutes: 60,
  ...overrides,
});

describe("vaqt yordamchilari", () => {
  it("parseTimeOfDay / formatTimeOfDay", () => {
    expect(parseTimeOfDay("00:00")).toBe(0);
    expect(parseTimeOfDay("19:30")).toBe(1170);
    expect(formatTimeOfDay(1170)).toBe("19:30");
    expect(formatTimeOfDay(1470)).toBe("00:30");
  });

  it.each(["24:00", "7:30", "19:60", "", "19-30"])("%s noto‘g‘ri", (value) => {
    expect(() => parseTimeOfDay(value)).toThrow();
  });

  it("Toshkent vaqti UTC+5", () => {
    expect(tashkentClock(new Date("2026-11-11T14:20:00Z"))).toEqual({
      date: "2026-11-11",
      minutes: 19 * 60 + 20,
    });
    // UTC bo‘yicha hali kecha, Toshkentda esa ertasi kun
    expect(tashkentClock(new Date("2026-11-11T20:30:00Z"))).toEqual({
      date: "2026-11-12",
      minutes: 90,
    });
  });
});

describe("generateSlotStarts", () => {
  it("oddiy kun: 10:00–23:00, oxirgi bron 22:00", () => {
    const starts = generateSlotStarts(rule());
    expect(formatTimeOfDay(starts[0])).toBe("10:00");
    expect(formatTimeOfDay(starts.at(-1)!)).toBe("22:00");
    expect(starts).toHaveLength(25);
  });

  it("yarim tundan keyin yopiladigan restoran", () => {
    const starts = generateSlotStarts(rule({ opensAt: "18:00", closesAt: "02:00" }));
    expect(formatTimeOfDay(starts[0])).toBe("18:00");
    expect(starts.at(-1)).toBe(25 * 60); // ertasi kun 01:00
  });

  it("00:00 da yopilish — kun oxiri", () => {
    const starts = generateSlotStarts(rule({ opensAt: "12:00", closesAt: "00:00" }));
    expect(formatTimeOfDay(starts.at(-1)!)).toBe("23:00");
  });

  it("15 daqiqalik oraliq", () => {
    const starts = generateSlotStarts(
      rule({
        opensAt: "12:00",
        closesAt: "13:00",
        intervalMinutes: 15,
        lastSeatingBeforeCloseMinutes: 0,
      }),
    );
    expect(starts.map(formatTimeOfDay)).toEqual(["12:00", "12:15", "12:30", "12:45", "13:00"]);
  });

  it("oxirgi bron ochilishdan oldin bo‘lsa — slot yo‘q", () => {
    expect(
      generateSlotStarts(
        rule({ opensAt: "12:00", closesAt: "12:30", lastSeatingBeforeCloseMinutes: 60 }),
      ),
    ).toEqual([]);
  });

  it.each([0, 4, 7.5, 241])("noto‘g‘ri oraliq %s rad etiladi", (intervalMinutes) => {
    expect(() => generateSlotStarts(rule({ intervalMinutes }))).toThrow();
  });
});

describe("filterBookableSlots", () => {
  const starts = generateSlotStarts(rule());

  it("boshqa kun uchun hammasi qoladi", () => {
    expect(
      filterBookableSlots(starts, { isToday: false, nowMinutes: 20 * 60, minLeadMinutes: 60 }),
    ).toEqual(starts);
  });

  it("bugun: o‘tgan va 60 daqiqadan yaqin slotlar olib tashlanadi", () => {
    const result = filterBookableSlots(starts, {
      isToday: true,
      nowMinutes: 18 * 60 + 10,
      minLeadMinutes: 60,
    });
    expect(result.map(formatTimeOfDay)).toEqual([
      "19:30",
      "20:00",
      "20:30",
      "21:00",
      "21:30",
      "22:00",
    ]);
  });
});

describe("groupSlotsByPeriod", () => {
  it("17:00 dan kechki guruh", () => {
    const { day, evening } = groupSlotsByPeriod([16 * 60 + 30, 17 * 60, 19 * 60]);
    expect(day).toEqual([990]);
    expect(evening).toEqual([1020, 1140]);
  });
});
