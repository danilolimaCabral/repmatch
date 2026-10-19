import { describe, expect, it } from "vitest";
import { formatCnpj, formatCpf, isValidCnpj, isValidCpf, isValidPayerDocument, normalizeCnpj, normalizeCpf } from "../shared/const";

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

  it("normalizes, formats and accepts a CNPJ with valid check digits", () => {
    expect(normalizeCnpj("04.252.011/0001-10abc")).toBe("04252011000110");
    expect(formatCnpj("04252011000110")).toBe("04.252.011/0001-10");
    expect(isValidCnpj("04.252.011/0001-10")).toBe(true);
    expect(isValidPayerDocument("CNPJ", "04.252.011/0001-10")).toBe(true);
  });

  it("rejects invalid CNPJ check digits and repeated values", () => {
    expect(isValidCnpj("04.252.011/0001-00")).toBe(false);
    expect(isValidCnpj("00.000.000/0000-00")).toBe(false);
  });
});
