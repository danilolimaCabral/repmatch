# Auditoria SEO RepMatch — 19 de outubro de 2026

## Fontes oficiais consultadas

- Google Search Central: [Learn about sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
  - Sitemap facilita a descoberta e o rastreamento de URLs importantes, mas não garante indexação.
  - As páginas importantes também devem estar acessíveis por links internos reais.
- Google Search Central: [Introduction to structured data markup](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
  - JSON-LD é o formato recomendado quando correto e consistente com conteúdo visível da página.
  - Dados estruturados devem descrever a URL em que estão presentes e ser completos e precisos.
  - Validar com Rich Results Test e acompanhar no Search Console após deploy.
- Google Search Central: [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
  - Priorizar conteúdo útil, original, preciso, assinado/revisado quando apropriado e feito para pessoas.
  - Não gerar páginas programáticas rasas apenas para capturar buscas.

## Achados externos do domínio

- A consulta `site:repmatch.com.br RepMatch representantes comerciais` retornou a home, confirmando que a marca já está indexada.
- Antes desta correção, páginas como `/pacotes-leads`, `/contatos-b2c` e `/blog` entregavam no HTML inicial title, description e canonical da home. Isso exigia renderização de JavaScript para a intenção correta da página.
- A melhoria implementada nesta rodada passa a servir title, description, canonical, robots e JSON-LD próprios no HTML inicial, além de 308 para aliases e 404 para URLs inexistentes.

## Direção editorial recomendada

- Priorizar páginas que respondam a tarefas reais: contratar representantes, representantes por UF quando houver inventário substancial, lista de empresas B2B para prospecção, checklist de contratação e prospecção para indústrias/distribuidores.
- Separar claramente "lista de empresas" de promessa de "lead qualificado"; explicar recorte, campos, atualização e limites reais.
- Reconciliar números e preços em home, páginas públicas e artigos antes de atualizar conteúdos antigos.
- Não usar superlativos ou estatísticas sem fonte e metodologia verificável.
- Medir no Search Console por página e consulta: impressões, cliques, CTR e posição média.
