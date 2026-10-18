import { describe, expect, it } from "vitest";
import {
  CNAE_461_CLASS_MAP,
  CNAE_RELATED_REPRESENTATIVE_MAP,
  getCnaeRepMatchMapping,
  getCnae461Mapping,
  isCnaeRepMatchCandidate,
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

  it("inclui CNAEs oficiais afins de representantes automotivos sem misturá-los ao grupo 46.1", () => {
    expect(Object.keys(CNAE_RELATED_REPRESENTATIVE_MAP).sort()).toEqual(["4512901", "4530706", "4542101"]);
    expect(isCnaeRepMatchCandidate("45.12-9/01")).toBe(true);
    expect(isCnaeRepMatchCandidate("45.30-7/06")).toBe(true);
    expect(isCnaeRepMatchCandidate("45.42-1/01")).toBe(true);
    expect(getCnaeRepMatchMapping("4512901")?.sourceGroup).toBe("afim");
    expect(isCnaeRepMatchCandidate("74.90-1/04")).toBe(false);
  });
});
