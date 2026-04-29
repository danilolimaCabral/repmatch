# RepMatch — TODO

## Fase 1: Banco de Dados
- [x] Criar schema: representatives, companies, jobs, applications, messages, unlocked_contacts
- [x] Adicionar campos de subscription_tier, dynamic_rank, rank_score nas tabelas
- [x] Gerar e aplicar migração SQL

## Fase 2: Backend (tRPC Routers)
- [x] Router: representatives (CRUD, perfil, plano)
- [x] Router: companies (CRUD, perfil, plano, ranking)
- [x] Router: jobs (criar, listar, filtrar por tier, fechar)
- [x] Router: applications/candidaturas (candidatar, listar por vaga, atualizar status)
- [x] Router: match (algoritmo de score por região, segmento, experiência, ativo)
- [x] Router: admin (importação de dados, gestão de usuários)

## Fase 3: Landing Page e Autenticação
- [x] Landing page com identidade RepMatch (preto, branco, verde vibrante)
- [x] Headline: "Conectamos Empresas e Representantes. Gerando Resultados."
- [x] CTAs: "Sou Empresa" e "Sou Representante"
- [x] Seção de features (Match IA, Ranking, Tier, Score, Notificações, Base 400k)
- [x] Seção de planos e preços (Representantes e Empresas)
- [x] Fluxo de onboarding pós-login: seleção de tipo de usuário (Empresa / Representante)
- [x] Formulário de perfil do Representante (região, segmento, experiência)
- [x] Formulário de perfil da Empresa (CNPJ, segmento, nome)

## Fase 4: Dashboards
- [x] Dashboard do Representante: listar vagas compatíveis por tier
- [x] Dashboard do Representante: candidatar-se a vagas
- [x] Dashboard do Representante: histórico de candidaturas com score e análise LLM
- [x] Dashboard da Empresa: criar vagas
- [x] Dashboard da Empresa: listar candidatos por vaga com match score
- [x] Dashboard da Empresa: desbloquear contato de representante (R$29)
- [x] Dashboard da Empresa: destacar vaga (R$49)
- [x] Painel Admin: visualizar todos os usuários, vagas e importações

## Fase 5: Importação Excel + Validação
- [x] Script de importação do arquivo Excel (representantes e empresas)
- [x] Validação e normalização de telefones (DDD + número)
- [x] Integração com BrasilAPI para enriquecimento de CNPJs
- [x] Rota de importação no painel admin

## Fase 6: Stripe
- [x] Configurar produtos e preços no Stripe (products.ts)
- [x] Assinaturas Representante: Premium R$19/mês, Elite R$49/mês
- [x] Assinaturas Empresa: Starter R$99/mês, Pro R$299/mês, Enterprise R$999/mês
- [x] Cobrança avulsa: contato desbloqueado R$29
- [x] Cobrança avulsa: vaga em destaque R$49
- [x] Webhook Stripe para atualizar tier no banco de dados

## Fase 7: LLM Match + Notificações
- [x] Match semântico com LLM: analisar descrição da vaga vs. perfil do representante
- [x] Score combinado: 60% critérios fixos + 40% LLM semântico
- [x] Notificação automática para empresa quando candidato de alto score se candidata

## Fase 8: Entrega
- [x] Testes vitest para routers principais (7 testes passando)
- [x] Checkpoint final
- [x] Documentação de uso

## Redesign Landing Page (Premium)
- [x] Logo grande e impactante no hero
- [x] Visual premium — sem cara de IA, aparência de produto SaaS de alto nível
- [x] Copy de alta conversão: headline, subheadline, prova social, urgência
- [x] Seção de números/stats (ex: 10k reps, 400k fornecedores, X matches)
- [x] Seção de como funciona (passo a passo visual)
- [x] Seção de depoimentos/prova social
- [x] Seção de planos com preços claros e CTAs fortes
- [x] FAQ
- [x] Footer profissional
- [x] Animações sutis e micro-interações

## Toggle Mensal/Anual nos Planos
- [x] Adicionar toggle mensal/anual na seção de planos da landing page
- [x] Calcular preços anuais com 20% de desconto para todos os planos
- [x] Mostrar badge "Economize X%" no plano anual
- [x] Animação suave na troca de preços

## Reestruturação: Autenticação Própria + Preview Inteligente
- [x] Criar tabela auth_users com email, senha (bcrypt), tipo (empresa/representante), plano
- [x] Criar endpoints de registro (POST /api/auth/register) e login (POST /api/auth/login) com JWT
- [ ] Criar endpoint de recuperação de senha (pendente)
- [x] Remover dependência do OAuth Manus dos fluxos principais
- [x] Criar página de cadastro dual: Empresa vs Representante com formulários separados
- [x] Criar página de login própria com email+senha
- [x] Implementar modelo de preview: empresa vê contador de reps por região/segmento
- [x] Mostrar dados parciais dos reps (nome parcial, cidade, segmento, experiência) — contato bloqueado
- [x] Exibir "X representantes disponíveis" com amostra de 3-5 cards antes de pagar
- [x] Bloquear acesso completo por plano: Free vê 3 reps, Starter vê 10, Pro vê todos

## Importação da Base Excel (EXPORT_20260424_1427502)
- [x] Analisar estrutura do arquivo Excel e mapear colunas
- [x] Criar script Python de importação com validação de CNPJ via BrasilAPI
- [x] Normalizar telefones (DDD + número, descartar inválidos)
- [x] Executar importação completa para o banco de dados (9.677 registros)
- [x] Verificar resultados e gerar relatório de importação

## Seção de Depoimentos Expandida
- [x] Substituir os 3 depoimentos simples por uma seção "wall of love" com 9 depoimentos em grid masonry
- [x] Adicionar avatares com iniciais coloridas, cargo, empresa e cidade de cada depoente
- [x] Incluir métricas de resultado em cada depoimento (ex: "fechei 3 contratos em 2 semanas")
- [x] Adicionar barra de estatísticas de satisfação acima dos cards

## Humanização e Comparação com Concorrência
- [x] Remover linguagem de IA/tecnologia do destaque — foco em resultados humanos
- [x] Reescrever headline, subheadline e CTAs com copy mais humano e direto
- [x] Criar seção de comparação RepMatch vs. concorrentes (LinkedIn, grupos de WhatsApp, indicação)
- [x] Atualizar badge do hero (tirar "Match por Inteligência Artificial")
- [x] Revisar toda a copy da landing para tom mais próximo, real e confiável

## Seção de Logos de Empresas Parceiras
- [x] Criar seção de logos de empresas parceiras com carrossel infinito (marquee) abaixo do hero

## Testes e Correções dos Fluxos
- [x] Testar fluxo completo do Representante (onboarding, dashboard, vagas, candidaturas)
- [x] Testar fluxo completo da Empresa (onboarding, dashboard, vagas, match)
- [x] Testar fluxo completo do Admin (importação, estatísticas, gestão)
- [x] Corrigir bugs encontrados nos testes

## Correções de Bugs Identificados
- [x] Adicionar chat interno nas candidaturas (Rep Dashboard e Company Dashboard)
- [x] Adicionar botão de editar perfil no dashboard do Representante
- [x] Adicionar botão de editar perfil no dashboard da Empresa
- [x] Melhorar Admin Dashboard com mais métricas e gráficos (barras de ranking e planos, últimas importações)
- [x] Adicionar rota de promoção de usuário para admin no backend
- [x] Adicionar aba de "Propostas" no Rep Dashboard
- [x] Adicionar aba de "Histórico de Contratações" no Company Dashboard
