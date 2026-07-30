/**
 * CNPJA API helper — valida situação cadastral de CNPJs na Receita Federal
 * Documentação: https://docs.cnpja.com
 */

const CNPJA_API_URL = "https://api.cnpja.com";

export interface CnpjaStatus {
  cnpj: string;
  isAtivo: boolean;
  situacao: string; // "Ativa", "Baixada", "Suspensa", "Inapta", etc.
  razaoSocial: string;
  nomeFantasia?: string;
  cnaePrincipal?: string;
  cnaeDescricao?: string;
  municipio?: string;
  uf?: string;
  telefone?: string;
  email?: string;
}

/**
 * Consulta a situação cadastral de um CNPJ na Receita Federal via CNPJA API.
 * Retorna null se a API não estiver disponível ou o CNPJ não for encontrado.
 */
export async function consultarCnpj(cnpj: string): Promise<CnpjaStatus | null> {
  const apiKey = process.env.CNPJA_API_KEY;
  if (!apiKey) {
    console.warn("[CNPJA] CNPJA_API_KEY not set, skipping validation");
    return null;
  }

  // Remove formatação do CNPJ (pontos, barras, traços)
  const cnpjLimpo = cnpj.replace(/\D/g, "");
  if (cnpjLimpo.length !== 14) {
    console.warn("[CNPJA] CNPJ inválido:", cnpj);
    return null;
  }

  try {
    const res = await fetch(`${CNPJA_API_URL}/office/${cnpjLimpo}?simples=false`, {
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!res.ok) {
      if (res.status === 404) {
        console.warn("[CNPJA] CNPJ não encontrado:", cnpjLimpo);
        return null;
      }
      console.error("[CNPJA] API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();

    const situacao: string = data.status?.text ?? "Desconhecida";
    const isAtivo = situacao.toLowerCase() === "ativa";

    return {
      cnpj: cnpjLimpo,
      isAtivo,
      situacao,
      razaoSocial: data.company?.name ?? data.alias ?? "",
      nomeFantasia: data.alias ?? undefined,
      cnaePrincipal: data.mainActivity?.id?.toString() ?? undefined,
      cnaeDescricao: data.mainActivity?.text ?? undefined,
      municipio: data.address?.municipality ?? undefined,
      uf: data.address?.state ?? undefined,
      telefone: data.phones?.[0]?.number ?? undefined,
      email: data.emails?.[0]?.address ?? undefined,
    };
  } catch (err: any) {
    console.error("[CNPJA] Fetch error:", err.message);
    return null;
  }
}

/**
 * Verifica se um CNPJ é de representante comercial (CNAE família 46xx)
 */
export function isRepresentanteComercial(cnaePrincipal?: string): boolean {
  if (!cnaePrincipal) return false;
  // CNAEs de representantes comerciais: 4611 a 4619
  const code = cnaePrincipal.replace(/\D/g, "").slice(0, 4);
  const num = parseInt(code, 10);
  return num >= 4611 && num <= 4619;
}
