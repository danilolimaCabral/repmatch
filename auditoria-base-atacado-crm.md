# Auditoria da base B2B do CRM de atacado

**Data:** 18 de outubro de 2026  
**Origem auditada:** projeto Railway `mkthubcrmTop`  
**Método:** consultas agregadas e somente leitura; nenhum registro individual foi exibido, exportado ou alterado.

## Resultado

A tabela `clientes` possui **671.548 registros**. Ela contém dados comerciais úteis para a nova oferta B2B: razão social, CNPJ, CNAE e descrição, telefone, e-mail, endereço, cidade, estado, CEP, segmento, porte, situação cadastral, site e Instagram, quando disponíveis.

A qualidade cadastral é alta: 671.433 registros têm CNPJ, 659.421 têm telefone, 586.400 têm e-mail e mais de 671 mil possuem cidade, estado e endereço. A base também tem classificação de mercado: B2B, B2C ou Ambos.

## Separação obrigatória de propriedade

Os registros estão vinculados a **três organizações** do CRM. A principal detém 671.045 registros; outras duas possuem 500 e 3 registros. O proprietário autorizou expressamente a importação de clientes empresariais ativos das três organizações. A importação mantém a organização de origem internamente para rastreabilidade.

A tabela `leadsPrivados` tem 233 registros vinculados a organizações e usuários específicos. Ela deve ficar fora da importação e nunca entrar automaticamente em um pacote comercial.

## Lote recomendado para o produto B2B

Na organização principal, há **399.069 registros B2B ou Ambos com situação cadastral ativa**, correspondendo a **298.062 CNPJs únicos ativos**. Desses registros ativos, 391.672 têm telefone e 363.463 têm e-mail; 362.337 possuem ambos os canais.

Com o escopo autorizado das três organizações e das classificações B2B, B2C e Ambos, a importação executada processou **604.043 registros empresariais ativos** e deduplicou o catálogo em **499.547 CNPJs únicos**. O catálogo contém 139.892 registros B2B, 201.485 B2C e 158.170 com atuação mista; 490.540 possuem telefone e 435.431 e-mail na fonte.

Para evitar duplicidade e venda de empresa inativa, o catálogo do RepMatch deve usar como regra de entrada:

1. Organizações autorizadas pelo proprietário.
2. `tipoMercado` igual a `B2B`, `B2C` ou `Ambos`.
3. Situação cadastral igual a `ATIVA`.
4. CNPJ normalizado e deduplicado.
5. Exclusão de `leadsPrivados`, carteiras internas, observações, responsáveis, sócios, histórico de contato, score interno e campos de uso exclusivo do CRM.

## Campos que podem compor o pacote

O pacote B2B pode expor razão social/nome fantasia, CNPJ, CNAE e descrição, segmento, situação cadastral, porte, cidade, estado, CEP, endereço, site e Instagram. Telefone e e-mail devem ser marcados como “quando disponíveis na fonte”, com finalidade comercial definida, registro de origem, prazo de atualização e mecanismo de oposição/descadastro.

## Implementação recomendada

Foi criada uma importação dedicada e idempotente no RepMatch, em lotes, com CNPJ normalizado, deduplicação e origem rastreável. Ela traz somente dados empresariais/comerciais autorizados e mantém contato de pessoa física fora da vitrine. O admin controla os preços de referência para pacotes de 1.000 e 2.000 empresas e acompanha a entrega manual.

O catálogo foi importado em lotes, com deduplicação por CNPJ, e pode ser executado novamente sem criar duplicidades quando a fonte precisar ser atualizada.
