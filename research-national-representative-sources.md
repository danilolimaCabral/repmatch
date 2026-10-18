# Fontes nacionais para ampliar a base de representantes comerciais

A base atual de CNPJ é a melhor fundação aberta para o RepMatch. A Receita Federal publica dados abertos cadastrais de pessoas jurídicas, e a classificação CNAE permite selecionar empresas cuja atividade é representação comercial. O grupo oficial **46.1** da CNAE reúne representantes comerciais e agentes do comércio, exceto veículos automotores e motocicletas. A subclasse **4619-2/00** cobre comércio em geral não especializado; há subclasses específicas, como **4614-1/00** para máquinas, equipamentos, embarcações e aeronaves. A expansão correta deve cobrir o grupo 46.1 inteiro, com regras por segmento, em vez de depender de uma única descrição textual. [1] [2] [3]

O Confere mantém uma consulta pública de representantes comerciais. Ela é útil para verificar registro individual e, em uma parceria institucional, para discutir uma fonte de validação. A página pública não deve ser tratada como licença para extração em massa: não há ali uma API nacional de exportação nem autorização explícita de uso comercial em lote. A rota recomendada é solicitar ao Confere e aos COREs regionais um convênio de validação ou um canal oficial de atualização. [4]

Como complemento para empresas e decisores B2B, provedores contratados podem enriquecer CNPJ, porte, CNAE e contatos corporativos. A Econodata informa cobertura de CNPJs ativos, filtros de setor, região e porte e uma API comercial; esse tipo de produto serve para a frente de leads B2B, não deve ser apresentado como registro oficial de representantes. A contratação precisa confirmar licença de redistribuição, atualização, campos permitidos e responsabilidades de tratamento. [5]

Para dados pessoais de representantes, a expansão precisa seguir LGPD. O guia da ANPD trata o legítimo interesse como hipótese legal que exige avaliação de finalidade, necessidade e salvaguardas. Para o RepMatch, a opção mais robusta é: dados públicos de empresa para o preview; contato completo após pagamento; registro voluntário e consentido do representante; e parceria formal quando houver dado de conselho ou associação. [6]

## Recomendação prática

1. **Agora:** auditar a importação atual e ampliar a seleção para todas as subclasses do grupo CNAE 46.1, marcando cada perfil com origem Receita Federal e data de atualização.
2. **Próxima etapa:** criar um selo de validação `CORE verificado` que só seja aplicado após consulta individual ou integração formal com Confere/CORE.
3. **B2B:** avaliar proposta comercial de API da Econodata, Serasa Experian ou Neoway apenas para empresas compradoras e inteligência de mercado, com revisão de licença e LGPD antes de importar ou redistribuir contatos.
4. **Base própria:** campanha de adesão para representantes com perfil gratuito, confirmação de e-mail/telefone e opção clara de remover dados. Isso converte a base pública em perfis completos, atualizados e com melhor conversão.

## Referências

[1]: https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/dados-abertos "Dados Abertos da Receita Federal"
[2]: https://concla.ibge.gov.br/busca-online-cnae.html?subclasse=4619200&tipo=cnae&view=subclasse "CNAE 4619-2/00"
[3]: https://concla.ibge.gov.br/busca-online-cnae.html?subclasse=4614100&view=subclasse "CNAE 4614-1/00"
[4]: https://www.confere.org.br/consulta_publica.php "Consulta Pública de Representantes Comerciais"
[5]: https://www.econodata.com.br/empresas/todo-brasil "Base de Empresas da Econodata"
[6]: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_legitimo_interesse.pdf "Guia da ANPD sobre Legítimo Interesse"
