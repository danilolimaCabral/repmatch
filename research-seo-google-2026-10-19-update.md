# Pesquisa SEO — atualização de 19/10/2026

O Google explica que um sitemap ajuda os mecanismos a descobrirem URLs importantes, mas não garante indexação. O arquivo é mais útil quando o site é novo, complexo ou tem conteúdo de mídia; links internos claros continuam essenciais.[1]

O Google orienta que conteúdo de qualidade seja feito principalmente para pessoas, com informação original, precisa, revisada e útil ao objetivo do leitor. Atualizar datas sem atualização substancial não é recomendado.[2]

Dados estruturados devem descrever o conteúdo visível da própria página. O Google recomenda JSON-LD por ser mais simples de manter e prioriza poucos dados completos e corretos em vez de schemas excessivos ou incompletos.[3]

Na verificação pública, as rotas indexáveis têm canonical próprio, áreas privadas usam `noindex`, a URL legada `/buscar-reps` redireciona para `/buscar` e uma URL inexistente retorna 404. A auditoria de código identificou como prioridades: consolidar metadados no HTML inicial, enriquecer schemas por rota, fornecer fallback sem JavaScript mais útil e manter o sitemap apenas com URLs públicas reais.

**References**

[1]: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview "Learn about sitemaps"
[2]: https://developers.google.com/search/docs/fundamentals/creating-helpful-content "Creating helpful reliable people-first content"
[3]: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data "Introduction to structured data markup in Google Search"
