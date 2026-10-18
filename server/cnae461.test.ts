import { describe, expect, it } from "vitest";
import {
  CNAE_461_CLASS_MAP,
  getCnae461Mapping,
  isCnaeRepresentativeCommercial,
  normalizeCnae,
} from "../shared/const";

describe("catálogo CNAE 46.1", () => {
  it("cobre as nove classes oficiais de representantes comerciais", () => {
    expect(Object.keys(CNAE_461_CLASS_MAP).sort()).toEqual([
      "4611", "4612", "4613", "4614", "4615", "4616", "4617", "4618", "4619",
    ]);
  });

  it("normaliza códigos com pontuação e identifica todo o grupo 46.1", () => {
    expect(normalizeCnae("46.19-2/00")).toBe("4619200");
    expect(isCnaeRepresentativeCommercial("46.11-7/00")).toBe(true);
    expect(isCnaeRepresentativeCommercial("46.18-4/02")).toBe(true);
    expect(isCnaeRepresentativeCommercial("47.89-0/99")).toBe(false);
  });

  it("prioriza subclasses especializadas e oferece fallback pela classe", () => {
    expect(getCnae461Mapping("4618402")?.segment).toBe("Saúde e Médico");
    expect(getCnae461Mapping("4618999")?.segment).toBe("Outros Especializados");
    expect(getCnae461Mapping("4619200")?.segment).toBe("Comércio em Geral");
  });
});
