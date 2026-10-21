# RepMatch — Brand Spec

## Ativos oficiais preservados

- **Logo:** `/manus-storage/repmatch-logo-nobg_ec328e76.png`
- **Banner lateral do hero da home:** `/manus-storage/Banner-Moderno_6a9f2769.gif` (GIF fornecido pelo usuário)
- **Vídeo de fundo do hero e de parcerias:** `/hero-bg.mp4` (ativo de runtime existente)
- **Marca:** RepMatch

## Sistema visual da home — impacto comercial

- **Modo:** redesign preserve; rotas, preços, copy de conformidade, formulários, CTAs e fluxos de checkout não são alterados.
- **Paleta:** grafite-esmeralda no hero (`#061f14` / `#071d14`), verde RepMatch como cor de ação, superfícies claras no restante da página para leitura e conversão.
- **Tipografia:** Bricolage Grotesque para títulos e Plus Jakarta Sans para leitura, ambas já carregadas pelo produto.
- **Composição:** um hero cinematográfico com o vídeo oficial de fundo, conteúdo alinhado à esquerda e o banner oficial fornecido no quadro à direita. Seções seguintes permanecem leves e orientadas à ação.
- **Movimento:** entradas curtas e luz ambiente no hero; todas as animações se desligam com `prefers-reduced-motion`.
- **Acessibilidade:** texto branco com contraste alto sobre overlay escuro; alvos de toque com no mínimo 44 px; sem depender do vídeo para entendimento da mensagem.

## V0 Impeccable — regras de composição

- **Hierarquia:** o hero apresenta somente duas decisões principais: encontrar representantes ou buscar leads B2B. A prova curta abaixo dele usa dados reais carregados da plataforma.
- **Superfícies:** evitar cartões dentro de cartões. Comparações de planos, benefícios e confiança usam divisores, tipografia e espaço em branco antes de recorrer a novas caixas.
- **Dados dinâmicos:** não exibir preços, contagens ou planos de fallback como se fossem reais. Enquanto o catálogo carrega, usar skeleton proporcional e `aria-busy`.
- **Ritmo:** evitar a repetição de eyebrow + título + parágrafo; alternar blocos editoriais, comparativos e fluxos funcionais.
- **Mobile:** manter navegação em drawer acessível e CTAs com área mínima de toque de 44 px.
- **Movimento:** animação apenas para entrada, feedback ou contexto. Respeitar `prefers-reduced-motion` também em contadores e indicadores.

## Não usar

- Superlativos, métricas inventadas ou depoimentos fictícios.
- Gradientes rosa/roxo ou cores que descaracterizem o verde/cinza da marca.
- Ilustrações que substituam a logo ou os ativos reais.
- Movimento contínuo fora do hero.
