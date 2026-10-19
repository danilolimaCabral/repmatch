import { describe, expect, it } from "vitest";
import { formatCpf, isValidCpf, normalizeCpf } from "../shared/const";

describe("CPF utilities", () => {
  it("normalizes and formats a CPF without retaining extra characters", () => {
    expect(normalizeCpf("123.456.789-09abc")).toBe("12345678909");
    expect(formatCpf("12345678909")).toBe("123.456.789-09");
  });

  it("accepts a CPF with valid check digits", () => {
    expect(isValidCpf("123.456.789-09")).toBe(true);
  });

  it("rejects incomplete, repeated and invalid check-digit CPF values", () => {
    expect(isValidCpf("123.456.789-00")).toBe(false);
    expect(isValidCpf("000.000.000-00")).toBe(false);
    expect(isValidCpf("123.456")).toBe(false);
  });
});
