import { describe, expect, it } from "vitest";
import { getLeadPackagePrice, isLeadPackageQuantity } from "../shared/leadPackages";

describe("pacotes de leads", () => {
  it("mantém os preços definidos para os pacotes B2B e B2C", () => {
    expect(getLeadPackagePrice("b2b", 179, 1000)).toBe(99);
    expect(getLeadPackagePrice("b2b", 179, 2000)).toBe(179);
    expect(getLeadPackagePrice("b2c", 149, 1000)).toBe(79);
    expect(getLeadPackagePrice("b2c", 149, 2000)).toBe(149);
  });

  it("mantém cálculo proporcional se o administrador configurar outro valor", () => {
    expect(getLeadPackagePrice("b2b", 200, 1000)).toBe(100);
  });

  it("aceita somente os tamanhos de pacote comercializados", () => {
    expect(isLeadPackageQuantity(1000)).toBe(true);
    expect(isLeadPackageQuantity(2000)).toBe(true);
    expect(isLeadPackageQuantity(1500)).toBe(false);
  });
});
