import { describe, expect, it } from "vitest";
import { getLeadPackagePrice, isLeadPackageQuantity } from "../shared/leadPackages";

describe("pacotes de leads", () => {
  it("calcula o pacote de 1.000 empresas de forma proporcional", () => {
    expect(getLeadPackagePrice(1490, 1000)).toBe(745);
    expect(getLeadPackagePrice(990, 1000)).toBe(495);
  });

  it("mantém o valor configurado para o pacote de 2.000 empresas", () => {
    expect(getLeadPackagePrice(1490, 2000)).toBe(1490);
  });

  it("aceita somente os tamanhos de pacote comercializados", () => {
    expect(isLeadPackageQuantity(1000)).toBe(true);
    expect(isLeadPackageQuantity(2000)).toBe(true);
    expect(isLeadPackageQuantity(1500)).toBe(false);
  });
});
