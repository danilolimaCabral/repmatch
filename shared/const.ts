export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// Valor avulso usado no carrinho de desbloqueio de contatos.
export const CONTACT_UNLOCK_PRICE = 9.9;
export const CONTACT_UNLOCK_PRICE_LABEL = "R$ 9,90";

export type Cnae461Mapping = {
  label: string;
  segment: string;
  prefix: string;
};

/**
 * Grupo CNAE 46.1: representantes comerciais e agentes do comércio.
 * A chave é a subclasse de sete dígitos, sem pontuação. Prefixos cobrem a classe
 * inteira e subclasses 4618 especializam o segmento exibido no RepMatch.
 */
export const CNAE_461_MAP: Record<string, Cnae461Mapping> = {
  "4611700": { prefix: "4611", label: "Matérias-primas agrícolas e animais vivos", segment: "Agronegócio" },
  "4612500": { prefix: "4612", label: "Combustíveis, minerais, siderurgia e químicos", segment: "Indústria e Químicos" },
  "4613300": { prefix: "4613", label: "Madeira, material de construção e ferragens", segment: "Construção Civil" },
  "4614100": { prefix: "4614", label: "Máquinas, equipamentos, embarcações e aeronaves", segment: "Máquinas e Equipamentos" },
  "4615000": { prefix: "4615", label: "Eletrodomésticos, móveis e artigos domésticos", segment: "Móveis e Decoração" },
  "4616800": { prefix: "4616", label: "Têxteis, vestuário, calçados e artigos de viagem", segment: "Têxtil e Moda" },
  "4617600": { prefix: "4617", label: "Produtos alimentícios, bebidas e fumo", segment: "Alimentos e Bebidas" },
  "4618401": { prefix: "4618", label: "Medicamentos, cosméticos e perfumaria", segment: "Farmacêutico" },
  "4618402": { prefix: "4618", label: "Instrumentos e materiais médico-hospitalares", segment: "Saúde e Médico" },
  "4618403": { prefix: "4618", label: "Jornais, revistas e outras publicações", segment: "Editorial e Comunicação" },
  "4618499": { prefix: "4618", label: "Outros produtos especializados", segment: "Outros Especializados" },
  "4619200": { prefix: "4619", label: "Mercadorias em geral não especializado", segment: "Comércio em Geral" },
};

export const CNAE_461_CLASS_MAP: Record<string, Cnae461Mapping> = {
  "4611": CNAE_461_MAP["4611700"],
  "4612": CNAE_461_MAP["4612500"],
  "4613": CNAE_461_MAP["4613300"],
  "4614": CNAE_461_MAP["4614100"],
  "4615": CNAE_461_MAP["4615000"],
  "4616": CNAE_461_MAP["4616800"],
  "4617": CNAE_461_MAP["4617600"],
  "4618": { prefix: "4618", label: "Produtos especializados", segment: "Outros Especializados" },
  "4619": CNAE_461_MAP["4619200"],
};

export function normalizeCnae(cnae?: string | null): string {
  return (cnae ?? "").replace(/\D/g, "");
}

export function isCnaeRepresentativeCommercial(cnae?: string | null): boolean {
  const prefix = normalizeCnae(cnae).slice(0, 4);
  return Boolean(CNAE_461_CLASS_MAP[prefix]);
}

export function getCnae461Mapping(cnae?: string | null): Cnae461Mapping | null {
  const normalized = normalizeCnae(cnae);
  return CNAE_461_MAP[normalized] ?? CNAE_461_CLASS_MAP[normalized.slice(0, 4)] ?? null;
}
