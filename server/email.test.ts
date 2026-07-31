import { describe, it, expect } from "vitest";

describe("Resend email helper", () => {
  it("should have RESEND_API_KEY configured", () => {
    const key = process.env.RESEND_API_KEY;
    expect(key).toBeTruthy();
    expect(key?.startsWith("re_")).toBe(true);
  });

  it("should instantiate Resend client without throwing", async () => {
    const { Resend } = await import("resend");
    const key = process.env.RESEND_API_KEY ?? "re_test";
    expect(() => new Resend(key)).not.toThrow();
  });
});
