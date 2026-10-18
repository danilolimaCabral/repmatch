type Municipality = { city: string; state: string };

type IbgeMunicipalityResponse = {
  nome?: string;
  microrregiao?: { mesorregiao?: { UF?: { sigla?: string } } };
};

const municipalityCache = new Map<string, { value: Municipality | null; expiresAt: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

/** Resolve um código IBGE de município para cidade e UF com cache de 30 dias. */
export async function resolveIbgeMunicipality(value?: string | null): Promise<Municipality | null> {
  const code = (value ?? "").replace(/\D/g, "");
  if (code.length !== 7) return null;

  const cached = municipalityCache.get(code);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${code}`, {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`IBGE ${response.status}`);
    const data = await response.json() as IbgeMunicipalityResponse;
    const city = data.nome?.trim();
    const state = data.microrregiao?.mesorregiao?.UF?.sigla?.trim();
    const result = city && state ? { city, state } : null;
    municipalityCache.set(code, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch (error) {
    console.warn("[IBGE] Não foi possível resolver município:", code);
    municipalityCache.set(code, { value: null, expiresAt: Date.now() + 1000 * 60 * 10 });
    return null;
  }
}
