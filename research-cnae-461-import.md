# Estrutura de importação — CNAE 46.1

O IBGE/Concla define o grupo CNAE **46.1** como representantes comerciais e agentes do comércio, exceto de veículos automotores e motocicletas. O grupo é a referência correta para construir a base nacional do RepMatch. Ele compreende atividades que comercializam mercadorias em nome de terceiros, por comissão ou honorários, sem propriedade da mercadoria. [1]

## Classes a incluir

| Prefixo CNAE | Segmento RepMatch proposto |
|---|---|
| 4611 | Agronegócio e matérias-primas agrícolas |
| 4612 | Combustíveis, minerais, siderurgia e químicos |
| 4613 | Madeira, construção e ferragens |
| 4614 | Máquinas, equipamentos, embarcações e aeronaves |
| 4615 | Eletrodomésticos, móveis e utilidades |
| 4616 | Têxtil, moda, calçados e viagem |
| 4617 | Alimentos, bebidas e fumo |
| 4618 | Especializados; decidir segmento pela descrição da subclasse |
| 4619 | Comércio geral não especializado |

O grupo 46.1 possui as nove classes acima. A classe 4619 cobre representantes não especializados; 4614 inclui, entre outros, máquinas de uso agrícola, equipamentos de informática e equipamentos médico-hospitalares. [1] [2] [3]

## Comparação com o sistema atual

A função `isRepresentanteComercial` já considera o intervalo de prefixos 4611 a 4619. A interface `BaseCNPJ.tsx` já possui uma lista de subclasses principais, incluindo 4611-7/00, 4612-5/00, 4613-3/00, 4614-1/00, 4615-0/00, 4616-8/00, 4617-6/00, quatro subclasses 4618 e 4619-2/00. O ponto que falta para uma importação auditável é transformar esse mapeamento em uma fonte única compartilhada e usar busca por prefixo de quatro dígitos, não apenas por códigos individuais.

## Pipeline recomendado

1. **Staging:** importar os arquivos CNPJ oficiais para uma tabela temporária com `cnpj`, razão social, nome fantasia, CNAE principal, UF, município, situação cadastral e data da fonte.
2. **Filtro:** aceitar somente CNAE principal normalizado cujo prefixo de quatro dígitos esteja entre 4611 e 4619. Registros fora do grupo ficam fora da tabela de representantes.
3. **Mapeamento:** consultar uma constante única `CNAE_461_SEGMENT_MAP`; para 4618, mapear por subclasse e guardar a descrição original do CNAE para auditoria.
4. **Qualidade:** desduplicar por CNPJ, exigir situação ativa, normalizar UF/município e registrar `source=receita_federal`, `source_updated_at` e `import_batch_id`.
5. **Upsert:** atualizar por CNPJ sem substituir dados voluntários do representante. Campos coletados pelo usuário, como biografia, CORE e disponibilidade, precisam prevalecer sobre os dados importados.
6. **Exposição:** mostrar a origem e a data de atualização na prévia. Só liberar telefone/e-mail a uma empresa após a regra de compra aprovada.
7. **Revisão:** processar deltas mensais, marcar registros baixados/suspensos como inativos e registrar métricas por UF, CNAE, lote e motivo de rejeição.

## Modelo de dados recomendado

Manter `cnpj_representatives` como camada de origem e criar uma tabela de catálogo de classificação:

```text
cnae_rep_mapping
- cnae_prefix_or_code (PK)
- level: class | subclass
- repmatch_segment
- display_label
- active
- source_version
- notes

cnpj_import_batches
- id
- source_name
- source_reference_date
- started_at / finished_at
- imported_count / updated_count / rejected_count
- checksum
```

Dessa forma, uma atualização de classificação não exige alterar código. O importador consulta a tabela ou uma constante derivada dela.

## Índices e consulta

Armazenar `cnae_principal_normalized` sem pontuação e criar índice composto `(cnae_principal_normalized, uf, cnpj)`. Para cobrir todo o grupo, usar `cnae_principal_normalized BETWEEN '4611' AND '4619'` somente se o campo estiver reduzido ao prefixo de quatro dígitos; se armazenar sete dígitos, usar condições por prefixo ou uma coluna derivada `cnae_group4`.

## Critério de segurança

O CNAE é um sinal de atividade empresarial, não prova de registro no CORE nem de disponibilidade real. Por isso, o RepMatch deve manter três estados distintos: `importado por CNAE`, `CNPJ ativo` e `CORE verificado`. A plataforma só deve exibir o selo CORE após validação documental, consulta individual ou convênio institucional.

## Referências

[1]: https://concla.ibge.gov.br/busca-online-cnae.html?view=grupo&tipo=cnae&versao=10&grupo=461 "Grupo 46.1 da CNAE"
[2]: https://concla.ibge.gov.br/busca-online-cnae.html?subclasse=4619200&tipo=cnae&view=subclasse "CNAE 4619-2/00"
[3]: https://concla.ibge.gov.br/busca-online-cnae.html?subclasse=4614100&view=subclasse "CNAE 4614-1/00"
