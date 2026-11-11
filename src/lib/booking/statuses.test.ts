import { describe, expect, it } from "vitest";
import {
  blockingStatuses,
  canTransition,
  isBlockingStatus,
  isFinalStatus,
  nextStatuses,
  reservationStatuses,
} from "./statuses";
import { Constants } from "@/types/database";

describe("bron holatlari", () => {
  it("bazadagi reservation_status enum bilan bir xil", () => {
    expect([...reservationStatuses]).toEqual([...Constants.public.Enums.reservation_status]);
  });

  it("stolni band qiluvchi holatlar", () => {
    expect([...blockingStatuses]).toEqual([
      "pending",
      "awaiting_payment",
      "confirmed",
      "checked_in",
    ]);
    expect(isBlockingStatus("confirmed")).toBe(true);
    expect(isBlockingStatus("cancelled")).toBe(false);
  });

  it("yakuniy holatdan hech qayerga o‘tib bo‘lmaydi", () => {
    const finals = reservationStatuses.filter(isFinalStatus);
    expect(finals).toEqual(["completed", "cancelled", "rejected", "expired", "no_show"]);
    for (const from of finals) {
      for (const to of reservationStatuses) expect(canTransition(from, to)).toBe(false);
    }
  });

  it("band qiluvchi holat yakuniy emas va aksincha", () => {
    for (const status of reservationStatuses) {
      expect(isBlockingStatus(status)).toBe(!isFinalStatus(status));
    }
  });

  it("asosiy yo‘l: pending → confirmed → checked_in → completed", () => {
    expect(canTransition("pending", "confirmed")).toBe(true);
    expect(canTransition("confirmed", "checked_in")).toBe(true);
    expect(canTransition("checked_in", "completed")).toBe(true);
  });

  it("taqiqlangan o‘tishlar", () => {
    expect(canTransition("pending", "completed")).toBe(false);
    expect(canTransition("checked_in", "cancelled")).toBe(false);
    expect(canTransition("confirmed", "pending")).toBe(false);
    expect(canTransition("pending", "no_show")).toBe(false);
  });

  it("o‘ziga o‘tish yo‘q", () => {
    for (const status of reservationStatuses) {
      expect(nextStatuses(status)).not.toContain(status);
    }
  });
});
