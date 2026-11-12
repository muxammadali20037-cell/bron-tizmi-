import { describe, expect, it } from "vitest";
import { appErrorCode, authErrorKey } from "./errors";

describe("authErrorKey", () => {
  it.each([
    [{ code: "otp_expired", status: 403 }, "codeInvalid"],
    [{ code: "over_sms_send_rate_limit", status: 429 }, "tooManySms"],
    [{ code: "over_request_rate_limit", status: 429 }, "tooManyAttempts"],
    [{ code: "sms_send_failed", status: 500 }, "smsFailed"],
    [{ code: "hook_timeout", status: 500 }, "smsFailed"],
    [{ code: "phone_provider_disabled", status: 400 }, "unavailable"],
    [{ code: "validation_failed", status: 400 }, "invalidPhone"],
    [{ status: 429, message: "too_many_attempts" }, "tooManySms"],
    [{ status: 400, message: "unsupported_phone" }, "invalidPhone"],
    [{ status: 429 }, "tooManyAttempts"],
    [{ code: "something_new", status: 500 }, "generic"],
  ] as const)("%o → %s", (error, expected) => {
    expect(authErrorKey(error)).toBe(expected);
  });

  it("xato yo‘q bo‘lsa — umumiy", () => {
    expect(authErrorKey(null)).toBe("generic");
  });
});

describe("appErrorCode", () => {
  it("bazadagi detail kodini oladi", () => {
    expect(appErrorCode({ code: "P0001", details: "already_invited" })).toBe("already_invited");
    expect(appErrorCode({ code: "P0001", details: "last_owner" })).toBe("last_owner");
  });

  it("ruxsat xatosini taniydi", () => {
    expect(appErrorCode({ code: "42501", details: null })).toBe("forbidden");
  });

  it("noma’lum xato — umumiy (texnik matn ko‘rsatilmaydi)", () => {
    expect(appErrorCode({ code: "XX000", details: "secret internal detail" })).toBe("generic");
    expect(appErrorCode(null)).toBe("generic");
  });
});
