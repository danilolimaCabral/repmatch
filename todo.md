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
- [x] Criar endpoint de recuperação de senha (implementado: /api/auth/forgot-password + /api/auth/reset-password, páginas /forgot-password e /reset-password, notificação via notifyOwner)
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

## Envio Real de E-mail (Resend)
- [x] Remover autenticação própria (email/senha) — apenas Manus OAuth
- [x] Remover páginas Login, Register, ForgotPassword, ResetPassword
- [x] Remover authRoutes.ts do servidor
- [x] Limpar schema: remover passwordHash, loginMethod, emailVerified, resetToken, resetTokenExpiry
- [x] Corrigir referências loginMethod em oauth.ts e sdk.ts

## Página Pública de Busca (/buscar)
- [x] Criar página client/src/pages/BuscarRepresentantes.tsx
- [x] Filtros por região e segmento (sem login necessário)
- [x] Contador de representantes disponíveis + cards com preview mascarado
- [x] CTA de cadastro/login para desbloquear contatos
- [x] Adicionar rota /buscar no App.tsx
- [x] Link para /buscar no header da landing page

## Auditoria e Melhorias dos Painéis
- [x] Auditar painel do Representante (fluxo completo, bugs, UX)
- [x] Auditar painel da Empresa (fluxo completo, bugs, UX)
- [x] Auditar painel Admin (métricas, gestão, bugs)
- [x] Corrigir bugs encontrados nos painéis
- [x] Melhorar UX dos painéis (loading states, empty states, feedbacks)
- [x] Criar página pública /buscar com filtros e preview de representantes
- [x] Adicionar link /buscar no header da landing page

## Melhorias e Correções dos Painéis (Auditoria 2)

- [x] Admin: corrigir adminStats() para retornar rankDistribution e tierDistribution
- [x] Admin: adicionar aba "Vagas" para visualizar todas as vagas publicadas
- [x] Admin: adicionar ação de desativar/reativar usuário (campo isActive na tabela users + botões Desativar/Reativar no painel)
- [x] Empresa: corrigir bug do Stripe checkout — updateJobMutation separado do updateStatusMutation
- [x] Empresa: corrigir "Destacar Vaga" para não depender de selectedJobId nulo (seletor inline de vaga aberta + botão desabilitado até selecionar)
- [x] Empresa: adicionar botão de pausar/fechar vaga diretamente na lista
- [x] Representante: adicionar filtro por comissão mínima nas oportunidades
- [x] Representante: mostrar badge de "nova" em vagas adicionadas nos últimos 3 dias
- [x] Página pública /buscar com filtros e preview de representantes

## Varredura Completa — Correção de Todos os Bugs

- [x] Auditar fluxo de registro (Empresa e Representante)
- [x] Auditar fluxo de login e redirecionamento pós-login
- [x] Auditar fluxo de onboarding (Empresa e Representante)
- [x] Auditar painel do Representante (todas as abas)
- [x] Auditar painel da Empresa (todas as abas)
- [x] Auditar painel Admin (todas as abas)
- [x] Auditar página /buscar (filtros, cards, CTA)
- [x] Corrigir todos os bugs encontrados

## Aba "Buscar Representantes" no Painel da Empresa

- [x] Criar procedure tRPC `representatives.listForCompany` com filtros e paginação
- [x] Adicionar aba "Buscar Representantes" no painel da empresa com cards completos
- [x] Exibir dados completos para planos pagos, dados parciais para Free
- [x] Filtros por região, segmento e plano do representante
- [x] Corrigir bug UNAUTHORIZED ao criar vaga (jobs.create funciona corretamente via cookie rm_session)
- [x] Corrigir bug de redirect prematuro no AdminDashboard (confirmado e corrigido)

## Testes de Browser e Correções Finais (Sessão 2)

- [x] Completar onboarding da empresa testuser@repmatch.com (Empresa Teste Ltda, Alimentos e Bebidas, SP Capital)
- [x] Verificar dashboard da empresa: aba Minhas Vagas, Candidaturas, Buscar Representantes, Perfil
- [x] Testar "Buscar Representantes": 9.677 reps exibidos com filtros funcionando
- [x] Testar "Publicar Vaga": vaga criada com sucesso (título, descrição, comissão)
- [x] Testar "Pausar Vaga": status alterado para "paused" no banco de dados
- [x] Corrigir bug: listJobs() sempre filtrava status=open mesmo no dashboard da empresa — agora mostra todas as vagas da empresa (abertas, pausadas, fechadas)
- [x] Testar "Reabrir Vaga": status volta para "open" corretamente
- [x] TypeScript: 0 erros após correção
- [x] Testes Vitest: 7/7 passando após correção

## Redesign Visual Completo — Menos IA, Mais Humano

- [x] Atualizar fontes globais para Plus Jakarta Sans + Bricolage Grotesque
- [x] Atualizar paleta de cores para tons mais naturais e humanos
- [x] Redesenhar landing page (Home.tsx) — layout, copy e visual
- [x] Redesenhar dashboard da empresa (CompanyDashboard.tsx)
- [x] Redesenhar dashboard do representante (RepDashboard.tsx)
- [x] Redesenhar telas de login e cadastro
- [x] Redesenhar tela de onboarding

## Correção do Fluxo de Pagamento — Desbloqueio de Contato

- [x] Webhook Stripe: tratar UNLOCK_CONTACT e registrar desbloqueio no banco após pagamento
- [x] Checkout: passar repId nos metadados da sessão Stripe
- [x] Frontend: detectar ?payment=success&rep_id=X na URL e registrar desbloqueio
- [x] Webhook: tratar FEATURED_JOB corretamente com job_id nos metadados

## Representante Encontra Empresa Rápido (A+B+C)

- [x] Backend: criar procedure pública `jobs.listPublic` com filtros de região/segmento e paginação
- [x] Landing page: adicionar seção "Vagas em Destaque" com cards de vagas reais abertas
- [x] Criar página pública /vagas com feed completo, filtros e CTA de cadastro
- [x] Adicionar link "Vagas" no header da landing page
- [x] Dashboard do Representante: melhorar feed de vagas com filtro rápido por região/segmento e visual mais atrativo
- [x] Registrar rota /vagas no App.tsx

## Pagamento PIX Obrigatório
- [x] Criar página /planos com todos os planos e opção PIX + Cartão
- [x] Remover plano Free — todos os planos exigem pagamento (pendente decisão do usuário)
- [x] Chave PIX telefone 41999499815 exibida na página /planos
- [x] Botão WhatsApp para envio de comprovante após PIX
- [x] Fluxo: usuário paga PIX → manda comprovante no WhatsApp → admin libera acesso
- [x] Cartão via Stripe como alternativa ao PIX

## Landing Page — Seções Inovadoras
- [x] Remover logos de empresas parceiras (fictícias)
- [x] Remover seção de depoimentos (fictícios) — substituída por Antes x Depois + Simulador
- [x] Criar simulador de match interativo (segmento + região → reps disponíveis em tempo real)
- [x] Criar seção contador ao vivo de representantes e vagas
- [x] Criar seção Antes x Depois (vida sem RepMatch vs com RepMatch)

## Modelo Freemium para Representantes

- [x] Schema: adicionar campos availability, workModel, cities, additionalSegments, linkedinUrl, avatarUrl, highlightedAt
- [x] Migração SQL aplicada ao banco de dados
- [x] Onboarding expandido: disponibilidade, modelo de trabalho, cidades, segmentos adicionais, LinkedIn
- [x] Procedures atualizadas: completeRepProfile e updateProfile aceitam novos campos
- [x] db.ts: listRepresentativesForCompany retorna novos campos + ordenação ouro > prata > bronze > free
- [x] BuscarRepresentantes: cards premium com badge Crown/Award/Medal, borda gradiente, badge de disponibilidade
- [x] RepDashboard: atualizar formulário de edição de perfil com novos campos
- [x] CompanyDashboard: exibir novos campos (disponibilidade, cidades, segmentos adicionais) nos cards de busca

## Integração BrasilAPI — Consulta de CNPJ Gratuita
- [x] Criar procedure pública `company.lookupCnpj` no servidor via BrasilAPI
- [x] Onboarding empresa: auto-preenchimento ao digitar CNPJ (razão social, nome fantasia, endereço, atividade)
- [x] CompanyDashboard: botão "Consultar CNPJ" para atualizar dados da empresa
- [x] Validação de formato de CNPJ (14 dígitos, máscara XX.XXX.XXX/XXXX-XX)
- [x] Exibir badge "CNPJ Verificado" no perfil da empresa após consulta bem-sucedida

## LGPD e Segurança
- [x] Criar página /privacidade com Política de Privacidade completa (LGPD)
- [x] Criar página /termos com Termos de Uso completos
- [x] Criar banner de cookie consent (aceitar/recusar cookies analíticos)
- [x] Adicionar checkbox de consentimento LGPD no onboarding
- [x] Criar tabela consent_logs no banco para registrar consentimentos
- [x] Implementar endpoint de exclusão de dados (direito ao esquecimento)
- [x] Atualizar footer com links reais para /privacidade e /termos
- [x] Adicionar links LGPD no onboarding e formulários
- [x] Registrar rotas /privacidade e /termos no App.tsx

## KYC e Verificação de Identidade + CORE
- [x] Schema: adicionar campos kycStatus, kycDocumentUrl, kycSelfieUrl, kycReviewedAt, kycNotes, coreNumber, coreState, coreStatus, coreValidUntil, coreCheckedAt na tabela representatives
- [x] Gerar e aplicar migration SQL dos novos campos
- [x] Procedure: uploadKycDocuments (salva doc + selfie no S3, muda status para pending_review)
- [x] Procedure: verifyKycWithAI (usa LLM vision para comparar selfie com documento e extrair dados)
- [x] Procedure: lookupCore (scraping do CONFERE por CPF/número de registro)
- [x] Procedure: adminReviewKyc (admin aprova/rejeita verificação manual)
- [x] Frontend: fluxo de verificação no RepDashboard (upload doc + selfie + número CORE)
- [x] Frontend: badge "Identidade Verificada" e "CORE Ativo" nos cards de representante
- [x] Frontend: painel admin para revisar KYC pendentes com imagens e dados extraídos
- [x] Frontend: exibir validade do CORE e estado nos cards para empresas

## Filtros de Verificação na Busca
- [x] Backend: adicionar parâmetros kycApproved e coreActive na procedure de busca pública
- [x] Backend: adicionar os mesmos filtros na busca do CompanyDashboard
- [x] Frontend BuscarRepresentantes: adicionar toggles "Apenas Verificados" e "CORE Ativo"
- [x] Frontend CompanyDashboard: adicionar os mesmos filtros na aba de busca

## Selos Visuais nos Cards de Representantes
- [x] BuscarRepresentantes: adicionar selos "Identidade Verificada" e "CORE Ativo" nos cards
- [x] CompanyDashboard: adicionar selos nos cards da aba de busca
- [x] RepDashboard: exibir selos no perfil próprio do representante

## Sprint: Admin PIX + Notificações
- [x] Painel admin /admin/pagamentos — listar usuários com tier "free", botão para ativar plano manualmente
- [x] Backend: procedure adminProcedure admin.activatePlan(userId, tier) para atualizar subscriptionTier
- [x] Notificação de boas-vindas no onboarding — notifyOwner com nome, tipo (rep/empresa) e região ao completar cadastro
- [x] Publicar site no domínio repmarket-jwuaunbc.manus.space

## Filtro de Disponibilidade
- [x] Backend: adicionar parâmetro availability em listRepresentativesForCompany e getRepresentativePreview
- [x] Frontend CompanyDashboard: select de disponibilidade na aba "Buscar Representantes"
- [x] Frontend BuscarRepresentantes: select de disponibilidade nos filtros públicos

## Ordenação por Disponibilidade
- [x] Backend: adicionar sortBy em listRepresentativesForCompany (availability, rating, tier)
- [x] Frontend CompanyDashboard: select de ordenação (Mais disponíveis / Melhor avaliados / Plano)

## Badge Disponibilidade + Contador + Job Agendado
- [x] Badge de disponibilidade nos cards do CompanyDashboard e BuscarRepresentantes
- [x] Contador "X disponíveis agora" no topo da aba de busca
- [x] Backend: countAvailableNow procedure + /api/scheduled/availability-reminder endpoint
- [x] Job agendado mensal para lembrar reps de atualizar disponibilidade (endpoint /api/scheduled/availability-reminder implementado)

## Substituição Auth Manus → Auth Própria (email/senha)
- [x] Schema: adicionar campo passwordHash na tabela users
- [x] Backend: criar rotas auth próprias (POST /api/auth/register, /api/auth/login, /api/auth/logout, GET /api/auth/me)
- [x] Backend: atualizar context.ts para ler JWT do cookie em vez de OAuth session
- [x] Backend: remover rotas OAuth (/api/oauth/*)
- [x] Frontend: criar página /login com formulário email+senha
- [x] Frontend: criar página /register com formulário email+senha+tipo
- [x] Frontend: atualizar useAuth() para usar /api/auth/me
- [x] Frontend: remover todos os botões/links de login Manus (getLoginUrl)
- [x] Frontend: remover callback OAuth do App.tsx
- [x] Remover dependências OAuth do package.json se houver

## ProtectedRoute + Página de Perfil
- [x] Componente ProtectedRoute com redirect para /login
- [x] Aplicar ProtectedRoute nas rotas protegidas (dashboard/rep, dashboard/company, admin, onboarding, verificacao, perfil)
- [x] Backend: procedure auth.updateProfile (nome, email)
- [x] Backend: procedure auth.changePassword (senha atual + nova)
- [x] Página /perfil com formulários de edição
- [x] Link para /perfil no DashboardLayout e menus de usuário

## Auth Avançado: Reset de Senha + Verificação de E-mail + Exclusão de Conta
- [x] Schema: tabela password_reset_tokens (token, userId, expiresAt, usedAt)
- [x] Schema: coluna emailVerified e emailVerificationToken nos users
- [x] Backend: POST /api/auth/forgot-password (gera token, notifica owner com link)
- [x] Backend: POST /api/auth/reset-password (valida token, atualiza senha)
- [x] Backend: POST /api/auth/verify-email (valida token de verificação)
- [x] Backend: procedure auth.deleteAccount (confirma senha, apaga dados LGPD)
- [x] Frontend: página /esqueci-senha com formulário de e-mail
- [x] Frontend: página /redefinir-senha?token=... com formulário nova senha
- [x] Frontend: banner de e-mail não verificado no dashboard
- [x] Frontend: botão "Excluir minha conta" na página /perfil com modal de confirmação

## Integração Base CNPJ (173.987 representantes)

- [x] Schema: adicionar tabela cnpjRepresentatives no drizzle/schema.ts
- [x] Backend: procedure pública `cnpjBase.search` com filtros (uf, cnae, porte, nome, página)
- [x] Backend: procedure pública `cnpjBase.stats` para totais por UF/segmento
- [x] Frontend: página /base-cnpj com busca, filtros e cards de 173.987 representantes
- [x] Frontend CompanyDashboard (Buscar Representantes): banner com link para Base CNPJ
- [x] Checkpoint e deploy

## Redesign Dashboards Internos — Tema Claro + Gráficos

- [x] Mudar DashboardLayout para tema claro (light mode) com fundo branco/cinza claro
- [x] Atualizar sidebar para visual claro: fundo branco, bordas sutis, ícones coloridos
- [x] CompanyDashboard: adicionar cards de KPIs (total vagas, candidaturas, reps buscados)
- [x] CompanyDashboard: gráfico de barras — candidaturas por vaga (Recharts)
- [x] CompanyDashboard: gráfico de pizza — status das vagas (Aberta/Pausada/Fechada)
- [x] CompanyDashboard: gráfico de linha — evolução de candidaturas ao longo do tempo
- [x] RepDashboard: adicionar cards de KPIs (oportunidades disponíveis, candidaturas enviadas, taxa de resposta)
- [x] RepDashboard: gráfico de barras — vagas por segmento
- [x] RepDashboard: gráfico de pizza — candidaturas por status
- [x] Melhorar tipografia, espaçamento e hierarquia visual em ambos os dashboards

## Logo e Chat Interno
- [x] Corrigir logo: remover fundo preto, gerar versão com fundo transparente
- [x] Chat interno: empresa pode abrir chat com rep após desbloquear contato (sem precisar de candidatura)
- [x] Chat interno: rep pode responder empresa no dashboard
- [x] Chat interno: notificação visual de mensagens não lidas

## Toggle Dark/Light + Tema Roxo
- [x] Criar ThemeContext com persistência em localStorage (dark/light)
- [x] Adicionar variáveis CSS do tema claro branco+roxo no index.css
- [x] Botão toggle dark/light no header da landing page
- [x] Botão toggle dark/light no DashboardLayout (sidebar ou topbar)
- [x] Remover referências à Base CNPJ/Receita Federal de todas as páginas
- [x] Corrigir logo para fundo transparente

## Banner Cookie/LGPD e Mobile
- [x] Remover banner CookieConsent (popup LGPD) do App.tsx
- [x] Adicionar aviso "Vire seu celular para ver melhor" para mobile em portrait

## Expansão de Perfis — Gerente Comercial + Documentação Obrigatória
- [x] Schema: adicionar tipo 'manager' no userType enum
- [x] Schema: adicionar campo cpf na tabela users (para gerente)
- [x] Schema: adicionar campos core_number, core_doc_url, core_status na tabela representatives
- [x] Schema: criar tabela rep_opportunities (rep publica sua disponibilidade)
- [x] Migração SQL aplicada
- [x] Onboarding: fluxo para Gerente Comercial (CPF obrigatório, região, segmento, tamanho de equipe)
- [x] Onboarding: CNPJ obrigatório para Empresa com validação de formato
- [x] Onboarding: CNPJ + CORE + upload de documentos obrigatórios para Representante
- [x] Dashboard Gerente: busca de reps, montar equipe, ver candidaturas
- [x] Rep: seção "Minhas Oportunidades" — rep publica vaga/disponibilidade própria
- [x] Página pública /oportunidades-reps — empresas e gerentes encontram reps disponíveis
- [x] Landing page: mostrar os 3 perfis (Empresa, Gerente, Representante)
- [x] Admin: painel de validação de documentos (CORE, CNPJ, identidade)

## Planos e Créditos do Gerente Comercial
- [x] Criar produtos Stripe: avulso R$29,90, Pacote Starter (5 créditos R$99,90), Pacote Pro (15 créditos R$249,90), Pacote Ilimitado (R$499,90/mês)
- [x] Schema: tabela manager_credits (userId, credits, totalPurchased, stripeCustomerId)
- [x] Schema: tabela manager_unlocks (managerId, repId, unlockedAt)
- [x] Migração SQL aplicada
- [x] Procedures: getManagerCredits, purchaseCredits (checkout Stripe), unlockRepContact (consome 1 crédito)
- [x] Webhook Stripe: creditar manager após pagamento confirmado
- [x] Página /planos-gerente com 4 opções de compra
- [x] ManagerDashboard: mostrar saldo de créditos no sidebar
- [x] ManagerDashboard: botão "Desbloquear contato" consome 1 crédito ou redireciona para compra

## Seção de Créditos na Landing Page
- [x] Adicionar seção "Sistema de Créditos" na landing page explicando como funciona para Gerente
- [x] Mostrar os 4 planos do Gerente na landing page com CTA para cadastro

## Créditos para Empresa e Representante na Landing Page
- [x] Adicionar sub-seção de créditos para Empresa (desbloqueio de contatos por crédito)
- [x] Adicionar sub-seção de créditos para Representante (destaque/visibilidade por crédito)

## Preparação para Publicação (Sprint Final)

- [x] Chat direto empresa ↔ rep após desbloqueio de contato (backend + UI)
- [x] Toggle Dark/Light no header da landing page e nos dashboards
- [x] Marcar job agendado de disponibilidade como concluído
- [x] Checkpoint final e publicação

## Painel Admin — Validação de Documentos (CORE, CNPJ, Identidade)
- [x] Backend: procedure admin.listPendingDocuments (KYC + CORE + CNPJ pendentes)
- [x] Backend: procedure admin.reviewKyc já existe — adicionar reviewCnpj e reviewCore
- [x] Backend: procedure admin.listAllDocuments com filtros (status, tipo)
- [x] Backend: procedure admin.getDocumentStats (contadores por status)
- [x] Frontend: aba "Documentos" no AdminDashboard com tabela de pendências
- [x] Frontend: modal de revisão com visualização de imagens (documento + selfie)
- [x] Frontend: botões Aprovar / Rejeitar com campo de observação
- [x] Frontend: filtros por tipo (KYC/CORE/CNPJ) e status
- [x] Frontend: badge de contador de pendências na aba

## Face Match Automático + Selos de Segurança

- [x] Backend: microserviço Python DeepFace para face match CNH vs selfie
- [x] Backend: integrar face match no fluxo kyc.submitDocuments (score automático)
- [x] Backend: salvar faceMatchScore no banco de dados
- [x] Frontend Admin: exibir score de similaridade no painel de documentos
- [x] Frontend Landing: seção de selos de segurança (SSL, LGPD, KYC, criptografia)
- [x] Frontend Landing: badges de confiança (Verificado, Seguro, LGPD Compliant)
- [x] Frontend Landing: seção "Como protegemos seus dados"

## Sistema de Avaliações
- [x] Schema: tabela rep_reviews (companyId, repId, rating 1-5, comment, createdAt)
- [x] Backend: procedure reviews.create (empresa avalia rep após desbloqueio de contato)
- [x] Backend: procedure reviews.listForRep (listar avaliações de um rep)
- [x] Backend: procedure reviews.myReviews (empresa vê suas avaliações enviadas)
- [x] Backend: atualizar campo avgRating na tabela representatives após nova avaliação
- [x] Frontend CompanyDashboard: botão "Avaliar" nos contatos desbloqueados
- [x] Frontend CompanyDashboard: modal de avaliação (estrelas + comentário)
- [x] Frontend RepDashboard: aba/seção com avaliações recebidas
- [x] Frontend BuscarRepresentantes: exibir estrelas e nota média nos cards
- [x] Frontend /oportunidades-reps: exibir estrelas nos cards

## Notificações por E-mail (Resend)
- [x] Notificações via helper interno notifyOwner (sem Resend externo)
- [x] Owner notificado quando empresa desbloqueia contato de representante
- [x] Owner notificado quando rep se candidata à vaga (com score e tag de alto score)
- [x] Owner notificado quando candidatura é aceita/rejeitada/contratado

## Dashboard Analytics Admin
- [x] Backend: procedure admin.weeklyGrowth (cadastros por semana, últimas 8 semanas)
- [x] Backend: procedure admin.conversionFunnel (cadastros → reps → empresas → planos pagos)
- [x] Backend: procedure admin.weeklyRevenue (receita por semana via Stripe API)
- [x] Frontend AdminDashboard: aba "Analytics" com gráfico de barras (crescimento semanal)
- [x] Frontend AdminDashboard: gráfico de funil de conversão
- [x] Frontend AdminDashboard: gráfico de linha de receita semanal (Stripe)

## Redesign — Tema Branco Predominante
- [x] CSS global: tema branco puro com verde esmeralda como cor de destaque, tipografia escura
- [x] Landing page: fundo branco, hero com gradiente sutil, seções alternadas branco/cinza claro
- [x] Dashboards: sidebar branca, cards com sombra suave, sem fundo escuro

## Finalização v1.5 — Analytics + Avaliações + Correções

- [x] Corrigir erro de sintaxe no RepDashboard.tsx (aba Reviews inserida dentro do bloco myopportunities)
- [x] Adicionar aba "Avaliações" no RepDashboard com resumo de estrelas e lista de avaliações recebidas
- [x] Adicionar query trpc.reviews.getByRep no RepDashboard
- [x] Adicionar aba "Analytics" no AdminDashboard com gráfico de crescimento semanal e funil de conversão
- [x] Mover procedures weeklyGrowth e conversionFunnel para o router admin (estavam no kyc)
- [x] Instalar pacote resend (aguardando chave de API do usuário para ativar)
- [x] TypeScript: 0 erros após todas as correções

## Análise e Correções — 07/05/2026

### SEO
- [x] Corrigir URLs canonical/og:url/twitter:url para repmatch.com.br
- [x] Corrigir sitemap.xml com URLs corretas
- [x] Corrigir robots.txt com URL do sitemap correto
- [x] Redirect 301 de www.repmatch.com.br para repmatch.com.br (conteúdo duplicado)

### Segurança
- [x] Adicionar headers de segurança HTTP: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- [x] Remover header X-Powered-By (expõe tecnologia)
- [x] Adicionar HSTS (Strict-Transport-Security)
- [x] Adicionar rate limiting nas rotas de autenticação e API (200 req/15min geral, 20 req/15min auth)

### Performance
- [x] Lazy loading nas rotas (bundle: 1.77MB -> 105KB)
- [x] Brotli/Gzip pré-comprimidos nos assets
- [x] Cache de 1 ano para assets com hash
- [x] Adicionar preload para fontes críticas no index.html
- [x] Adicionar dns-prefetch para domínios externos (fonts.googleapis.com)

### Banco de Dados
- [x] Adicionar índice em representatives.userId
- [x] Adicionar índice em companies.userId
- [x] Adicionar índice em applications.repId e applications.jobId
- [x] Adicionar índice em messages.applicationId
- [x] Adicionar índice em directChatMessages.companyId+representativeId e senderId

## E-mail Transacional (Resend) + Teste de Fluxo — 07/05/2026

- [ ] Instalar Resend e configurar RESEND_API_KEY
- [ ] Criar server/email.ts com helper sendEmail() e templates HTML profissionais
- [ ] Template: e-mail de boas-vindas para representante
- [ ] Template: e-mail de boas-vindas para empresa
- [ ] Template: notificação de nova candidatura (para empresa)
- [ ] Template: alerta de candidatura aceita/match (para representante)
- [ ] Template: reset de senha com link seguro
- [ ] Integrar envio de boas-vindas no fluxo de onboarding (routers.ts)
- [ ] Integrar envio de notificação de candidatura no fluxo de apply
- [ ] Integrar envio de alerta de match quando empresa aceita candidatura
- [ ] Integrar envio de e-mail de reset de senha real (substituir notifyOwner)
- [ ] Testar fluxo completo: cadastro representante → candidatura → aceite
- [ ] Testar fluxo completo: cadastro empresa → publicar vaga → aceitar candidato

## Autenticação Própria — Revisão e Admin

- [x] Verificar se o sistema de auth próprio (email/senha) está funcionando em produção
- [x] Criar usuário admin padrão (admin@repmatch.com.br)
- [x] Testar fluxo de login/cadastro/logout em produção

## Carrinho de Desbloqueio (Pix + Admin)

- [x] Schema: tabelas unlock_requests e unlock_request_items criadas e migradas
- [x] Backend tRPC: create, uploadPixProof, myRequests, adminList, approve, reject
- [x] CompanyDashboard: botão "Adicionar ao carrinho" em cada card de rep
- [x] CompanyDashboard: botão "Carrinho" no header com badge de contagem
- [x] CompanyDashboard: modal do carrinho com resumo, total e opções de pagamento (Pix / Stripe)
- [x] CompanyDashboard: fluxo Pix — chave Pix, upload de comprovante, confirmação
- [x] AdminDashboard: aba "Desbloqueios" com lista de solicitações, filtros e busca
- [x] AdminDashboard: botões Aprovar / Rejeitar com visualização do comprovante
- [x] Contatos desbloqueados automaticamente ao aprovar (tabela unlocked_contacts)

## Tema Claro + Botões Modernos

- [x] Forçar tema claro (light) em toda a plataforma — ThemeProvider fixo em "light"
- [x] Redesenhar página de Login com fundo claro, cards com fotos e badges modernos
- [x] Botões com gradientes, sombras coloridas e hover effects (hover:-translate-y-0.5)
- [x] AdminDashboard: corrigir loading state (bg-[#080808] → bg-slate-50)
- [x] Usuário demo com acesso a todos os 3 painéis (Representante, Empresa, Gerente)

## Dados de Contato Reais (CNPJA) para Empresas

- [x] Corrigir listRepresentativesForCompany: retornar representatives.email (CNPJA) em vez de users.email (fake import)
- [x] Adicionar campos cidade, estado, situacaoCadastral, cnpj, nomeFantasia ao select da busca
- [x] Remover leftJoin com tabela users (não mais necessário após correção)
- [x] CompanyDashboard: exibir cidade/estado do CNPJA nos cards (em vez de região genérica)
- [x] CompanyDashboard: exibir CNPJ e nome fantasia para representantes desbloqueados

## Correção Fluxo Pix — Carrinho de Desbloqueios

- [x] Corrigir erro de insert na tabela unlock_requests (totalAmount com cifrão → String(totalAmount))
- [x] Corrigir priceUnit nos itens (String(PRICE_PER_REP) em vez de toFixed)
- [x] Implementar fluxo QR Code (30s countdown) → upload comprovante → admin libera
- [x] QR Code gerado via api.qrserver.com com chave Pix 41999499815
- [x] Botão "Já paguei — Enviar comprovante agora" para pular countdown
- [x] Barra de progresso visual durante countdown
- [x] Corrigir filtro "pending_proof" → "pending_payment" no AdminDashboard
- [x] Adicionar status "Cancelado" no badge do AdminDashboard

## Auditoria Banco de Produção (Railway) — 30/07/2026

- [x] Verificar tabelas existentes no banco de produção (Railway)
- [x] Criar tabelas faltantes: unlock_requests, unlock_request_items, mp_payments
- [x] Adicionar colunas CNPJA no banco de produção (email, nomeFantasia, cidade, estado, etc.)
- [x] Adicionar coluna cnpjaRawJson no banco de desenvolvimento (TiDB) — estava como cnpjaRawData
- [x] Criar usuário admin@repmatch.com.br no banco de produção (Railway)
- [x] Verificar cadastros reais em produção: Tambasa (Matheus), LC Brownies (Lucas), Maria Eduarda
- [x] Confirmar fluxo Pix funcionando: QR Code gerado com sucesso via Mercado Pago API
- [x] Confirmar 9.680 representantes carregando corretamente no dev server

## Novas Funcionalidades — Plataforma Completa (30/07/2026)

### E-mail Transacional (Resend)
- [ ] Instalar Resend e configurar RESEND_API_KEY
- [ ] Criar server/email.ts com helper sendEmail() e templates HTML profissionais
- [ ] Template: boas-vindas para representante
- [ ] Template: boas-vindas para empresa
- [ ] Template: nova candidatura (para empresa)
- [ ] Template: candidatura aceita/match (para representante)
- [ ] Template: reset de senha com link seguro
- [ ] Template: desbloqueio aprovado (para empresa)
- [ ] Integrar envio no onboarding, candidatura, aceite e reset de senha

### Paywall Inteligente
- [ ] Limitar visualizações de contatos completos por plano (Free: 3, Starter: 20, Pro: ilimitado)
- [ ] Exibir contador "X visualizações restantes" no painel da empresa
- [ ] Bloquear busca avançada para Free após limite atingido com CTA de upgrade

### Vagas Públicas com SEO
- [ ] Criar páginas de vaga individuais (/vagas/[id]) com meta tags OpenGraph + JSON-LD
- [ ] Gerar sitemap dinâmico de vagas abertas
- [ ] Adicionar breadcrumbs e schema.org JobPosting

### Métricas do Representante
- [ ] Backend: procedure representatives.myStats (visualizações de perfil, desbloqueios, candidaturas, taxa de resposta)
- [ ] Frontend RepDashboard: aba/seção "Minhas Métricas" com cards de KPIs e gráficos
- [ ] Registrar visualizações de perfil quando empresa abre card do rep

### Notificações WhatsApp (Gratuito)
- [ ] Integrar Evolution API (self-hosted) ou Baileys para WhatsApp gratuito
- [ ] Notificar representante no WhatsApp quando empresa desbloqueia seu contato
- [ ] Notificar empresa no WhatsApp quando rep se candidata à vaga

### Histórico de Contratos e Parcerias
- [ ] Schema: tabela partnerships (companyId, repId, startDate, endDate, status, notes)
- [ ] Backend: procedures para criar, listar e encerrar parcerias
- [ ] Frontend: aba "Parcerias" no CompanyDashboard e RepDashboard

## Correções e Melhorias — Analytics + Contatos (31/07/2026)

### Analytics Real (page_views)
- [x] Criar tabela page_views no banco (path, sessionId, ip, userAgent, createdAt)
- [x] Endpoint /api/track-pv no servidor Express para rastrear visitas anonimamente
- [x] PageViewTracker no App.tsx — rastreia cada mudança de rota automaticamente
- [x] Atualizar siteAnalytics no routers.ts para usar dados reais da tabela page_views + users
- [x] Corrigir AdminDashboard: métricas Pageviews, Visitantes Únicos, Novos Cadastros, Conversão
- [x] Gráfico de linha com 3 séries: Pageviews, Visitantes Únicos, Novos Cadastros

### Admin — Tabela de Usuários
- [x] Coluna "Perfil" com badge Completo/Parcial/Incompleto baseado em profileStatus
- [x] Botão "Email" para enviar email de boas-vindas/cadastro via Resend

### CompanyDashboard — Aba Meus Contatos
- [x] Nova aba "Meus Contatos" no sidebar com ícone BookUser
- [x] Query trpc.contacts.myUnlockedContacts carregada ao acessar a aba
- [x] Cards com avatar, nome, segmento, região, telefone, email, LinkedIn
- [x] Badge de experiência e plano do representante
- [x] Data de desbloqueio e valor pago em cada card
- [x] Estado vazio com CTA para buscar representantes
- [ ] Adicionar vídeo de fundo na seção hero da landing page (Home.tsx) usando /hero-bg.mp4
- [ ] Adicionar botão flutuante do WhatsApp (41999499815) em todas as páginas
- [ ] Melhorias de SEO: sitemap.xml, robots.txt, Schema.org, meta tags otimizadas

## Correções de UX — Logout e Onboarding (03/08/2026)

- [x] Adicionar menu dropdown com logout no botão do usuário na navbar (botão "Olá, danilo" sem opção de sair)
- [x] Corrigir tela de onboarding que aparece após login (deve ir direto ao dashboard sem pedir tipo novamente)

## Mensagem de Boas-vindas (03/08/2026)

- [ ] Adicionar mensagem de boas-vindas personalizada com nome do usuário nos dashboards (Rep, Empresa, Gerente)

## Toast de Boas-vindas (03/08/2026)

- [ ] Implementar toast de boas-vindas personalizado nos dashboards Rep, Empresa e Gerente (aparece uma vez por sessão ao carregar o perfil com sucesso)

## SEO Orgânico Google (03/08/2026)

- [ ] Otimizar meta tags (title, description) em todas as páginas públicas
- [ ] Adicionar Open Graph tags (og:title, og:description, og:image) para compartilhamento social
- [ ] Implementar Schema.org JSON-LD (Organization, WebSite, Service, FAQPage)
- [ ] Criar/atualizar sitemap.xml com todas as URLs públicas
- [ ] Criar/atualizar robots.txt correto
- [ ] Adicionar canonical URLs para evitar conteúdo duplicado
- [ ] Criar página de blog/conteúdo com artigos sobre representação comercial
- [ ] Adicionar alt text em todas as imagens
- [ ] Otimizar títulos H1/H2/H3 com palavras-chave
- [ ] Criar página de FAQ otimizada para SEO
- [ ] Adicionar Google Search Console verification meta tag

## Melhorias UX Páginas Públicas (03/08/2026)

- [ ] Página Vagas: verificar e corrigir botões, garantir que vagas públicas aparecem
- [ ] Buscar Representantes: melhorar filtros (região, segmento, experiência) com busca funcional
- [ ] Buscar Representantes: mostrar cards com dados parciais bloqueados (nome parcial, região, segmento visíveis) com cadeado — evidenciar que há base cadastrada
- [ ] Buscar Representantes: exibir contador total de representantes disponíveis

## Blog SEO (03/08/2026)

- [ ] Criar página de listagem do blog (/blog) com cards de artigos
- [ ] Criar página de artigo individual (/blog/:slug) com conteúdo completo
- [ ] Criar 8 artigos SEO sobre representação comercial
- [ ] Adicionar link para o blog na navbar
- [ ] Atualizar sitemap.xml com URLs do blog
- [ ] Adicionar Schema.org Article em cada artigo

## SEO Completo + Blog (03/08/2026)

- [x] Criar página /blog com listagem de artigos e design profissional
- [x] Criar página /blog/:slug com artigo individual e Schema.org Article
- [x] Criar 8 artigos SEO sobre representação comercial
- [x] Adicionar link "Blog" na navbar principal
- [x] Melhorar componente SEO com meta tags dinâmicas por página
- [x] Atualizar sitemap.xml com todas as URLs do blog
- [x] Adicionar Schema.org Organization na home
- [x] Adicionar Schema.org FAQPage na seção FAQ
- [x] Adicionar Schema.org BreadcrumbList nas páginas internas
- [x] Melhorar robots.txt com regras específicas

## Melhorias de Performance PageSpeed (03/08/2026)

- [x] Adicionar width/height explícitos na logo para evitar CLS
- [x] Adicionar preload para fontes Google Fonts críticas no index.html
- [x] Otimizar imagens com width/height para evitar layout shift

## Blog: Sistema de Reações + Melhorias Visuais + SEO (03/08/2026)

- [x] Criar tabela blog_reactions no schema (id, slug, reaction, sessionId, createdAt)
- [x] Aplicar migração SQL no banco de dados
- [x] Implementar procedure tRPC blog.getReactions (contagem por tipo)
- [x] Implementar procedure tRPC blog.toggleReaction (toggle por sessionId anônimo)
- [x] Implementar procedure tRPC blog.getUserReactions (reações do usuário por sessão)
- [x] Adicionar componente BlogReactions no BlogPost.tsx com 4 emojis (👍 ❤️ 🚀 💡)
- [x] Optimistic updates no sistema de reações (sem delay visual)
- [x] Melhorar Blog.tsx: adicionar busca por texto e filtros de categoria
- [x] Melhorar Blog.tsx: mostrar tags nos cards de artigos
- [x] Melhorar Blog.tsx: adicionar estatísticas do blog (artigos, categorias, tempo médio)
- [x] Melhorar Blog.tsx: estado vazio com botão de limpar filtros
- [x] Atualizar sitemap.xml com todos os 12 artigos do blog
- [x] Melhorar index.html: carregamento não-bloqueante das fontes (media=print trick)
- [x] Melhorar index.html: adicionar DNS prefetch para Stripe e MercadoPago
- [x] Melhorar index.html: atualizar FAQ Schema.org com pergunta sobre CORE
- [x] Melhorar index.html: adicionar Blog no BreadcrumbList Schema.org

## E-mails Transacionais (04/08/2026)

- [x] Template base HTML profissional com header/footer/hero/CTA
- [x] E-mail de boas-vindas para representante (após completeRepProfile)
- [x] E-mail de boas-vindas para empresa (após completeCompanyProfile)
- [x] E-mail de confirmação de candidatura para o representante (após submit)
- [x] E-mail de notificação para empresa quando recebe nova candidatura
- [x] E-mail de confirmação de desbloqueio de contato (após pagamento Stripe)
- [x] E-mail de confirmação de assinatura de plano (rep e empresa)
- [x] Templates adicionais: match notification rep/empresa, finalizar cadastro (legado)

## Resumo IA no E-mail de Candidatura para Empresa (04/08/2026)

- [x] Gerar resumo IA dos pontos fortes do representante no backend (routers.ts, candidaturas.submit)
- [x] Passar o resumo IA como parâmetro para sendNewApplicationToCompanyEmail
- [x] Atualizar template HTML do e-mail com seção visual "Análise IA" destacando os pontos fortes
