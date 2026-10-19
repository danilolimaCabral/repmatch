import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const dashboardPath = path.resolve(process.cwd(), "client/src/pages/AdminDashboard.tsx");
const dashboardSource = fs.readFileSync(dashboardPath, "utf8");
const companyDashboardSource = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/CompanyDashboard.tsx"), "utf8");
const mpRoutesSource = fs.readFileSync(path.resolve(process.cwd(), "server/mercadopago/mpRoutes.ts"), "utf8");
const sharedConstantsSource = fs.readFileSync(path.resolve(process.cwd(), "shared/const.ts"), "utf8");
const routersSource = fs.readFileSync(path.resolve(process.cwd(), "server/routers.ts"), "utf8");
const dbSource = fs.readFileSync(path.resolve(process.cwd(), "server/db.ts"), "utf8");
const serverSource = fs.readFileSync(path.resolve(process.cwd(), "server/_core/index.ts"), "utf8");
const homeSource = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const repDashboardSource = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/RepDashboard.tsx"), "utf8");
const managerDashboardSource = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/ManagerDashboard.tsx"), "utf8");
const dashboardSkeletonSource = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/DashboardLayoutSkeleton.tsx"), "utf8");
const roiCalculatorSource = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/ROICalculator.tsx"), "utf8");
const manusDialogSource = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/ManusDialog.tsx"), "utf8");
const leadPackagesSource = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/LeadPackages.tsx"), "utf8");
const seoSource = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/SEO.tsx"), "utf8");
const sitemapSource = fs.readFileSync(path.resolve(process.cwd(), "client/public/sitemap.xml"), "utf8");
const robotsSource = fs.readFileSync(path.resolve(process.cwd(), "client/public/robots.txt"), "utf8");
const indexHtmlSource = fs.readFileSync(path.resolve(process.cwd(), "client/index.html"), "utf8");
const brazilMapSource = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/BrazilMapSection.tsx"), "utf8");
const publicPageSources = Object.fromEntries(
  ["BuscarRepresentantes", "OportunidadesReps", "Blog", "BlogPost", "BaseCNPJ", "Planos", "ManagerPlans", "Parcerias", "Onboarding", "Login", "Register", "RedefinirSenha", "Perfil", "VerificacaoKYC"]
    .map((name) => [name, fs.readFileSync(path.resolve(process.cwd(), `client/src/pages/${name}.tsx`), "utf8")])
);

describe("AdminDashboard mobile layout", () => {
  it("uses an overlay drawer on mobile instead of reserving the desktop sidebar width", () => {
    expect(dashboardSource).toContain("fixed inset-y-0 left-0 z-50");
    expect(dashboardSource).toContain("w-[min(18rem,calc(100vw-2.5rem))]");
    expect(dashboardSource).toContain("lg:static lg:z-auto lg:w-64 lg:translate-x-0");
    expect(dashboardSource).toContain("setMobileMenuOpen(false)");
  });

  it("keeps Analytics controls and KPI cards responsive on narrow viewports", () => {
    expect(dashboardSource).toContain("grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto");
    expect(dashboardSource).toContain("mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4");
    expect(dashboardSource).toContain("min-w-0 rounded-lg border border-border p-3 sm:p-4");
  });

  it("turns general indicators into accessible navigation shortcuts", () => {
    expect(dashboardSource).toContain("function openIndicator(tab: typeof activeTab");
    expect(dashboardSource).toContain('aria-label={`Acessar ${kpi.destination}`}');
    expect(dashboardSource).toContain('tab: "representantes" as const');
    expect(dashboardSource).toContain('tab: "pagamentos" as const');
    expect(dashboardSource).toContain('userType: "company"');
  });

  it("loads the configured contact price before showing the PIX cart", () => {
    expect(sharedConstantsSource).toContain("CONTACT_UNLOCK_PRICE = 9.9");
    expect(companyDashboardSource).toContain("Gerar QR Code PIX");
    expect(companyDashboardSource).toContain("trpc.pricing.contactUnlockPrice.useQuery()");
    expect(companyDashboardSource).toContain("contactUnlockPriceLabel");
  });

  it("queues a Mercado Pago PIX confirmation for manual admin release", () => {
    expect(mpRoutesSource).toContain('status: "pending_approval"');
    expect(mpRoutesSource).toContain("awaiting manual approval");
    expect(mpRoutesSource).not.toContain('status: "approved", reviewedAt');
    expect(dashboardSource).toContain("PIX confirmado — liberar");
    expect(dashboardSource).toContain("Liberar contatos");
    expect(routersSource).toContain("confirmPix: protectedProcedure");
    expect(dashboardSource).toContain("Confirmar PIX");
    expect(dashboardSource).toContain("Desbloqueios de contatos por PIX");
    expect(dashboardSource).toContain("Ver solicitações");
    expect(dashboardSource).toContain("Carrinhos abandonados");
    expect(dashboardSource).toContain("unlockRequestGroups");
    expect(dashboardSource).toContain("Confirmar PIX recebido");
  });

  it("uses cards instead of clipped tables in the principal mobile admin lists", () => {
    expect(dashboardSource).toContain('className="divide-y divide-border sm:hidden"');
    expect((dashboardSource.match(/className="hidden w-full text-sm sm:table"/g) ?? []).length).toBeGreaterThanOrEqual(5);
    expect(dashboardSource).toContain("Ver dados fiscais");
    expect(dashboardSource).toContain("Ativar plano");
  });

  it("tracks company purchase interest and exposes top representative cards to admins", () => {
    expect(companyDashboardSource).toContain("trackPurchaseInterest.mutate({ representativeId: repId, source })");
    expect(routersSource).toContain("trackPurchaseClick: protectedProcedure");
    expect(routersSource).toContain("purchaseInterest: protectedProcedure");
    expect(dashboardSource).toContain("Interesse em comprar contatos");
    expect(dashboardSource).toContain("Cards mais procurados");
  });

  it("creates the purchase-interest table safely when production boots", () => {
    expect(serverSource).toContain("CREATE TABLE IF NOT EXISTS representative_purchase_clicks");
    expect(serverSource).toContain("await ensurePurchaseInterestTable()");
  });

  it("lets admins manage prices, abandoned carts, registrations, and return navigation", () => {
    expect(routersSource).toContain("updateContactUnlockPrice: protectedProcedure");
    expect(routersSource).toContain("company_contact_unlock_price");
    expect(dashboardSource).toContain("Campanhas B2B/B2C");
    expect(dashboardSource).toContain("Carrinhos abandonados");
    expect(dashboardSource).toContain("Ver cadastros");
    expect(dashboardSource).toContain("Voltar ao painel");
  });

  it("uses compact authenticated controls in the mobile landing-page header", () => {
    expect(homeSource).toContain('className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:h-[72px] sm:px-6"');
    expect(homeSource).toContain('className="hidden sm:inline">Painel Admin</span>');
    expect(homeSource).toContain('className="hidden sm:inline">Olá, {user?.name?.split(" ")[0]}</span>');
    expect(homeSource).toContain("<UserCog className=\"h-4 w-4 sm:hidden\"");
  });

  it("uses overlay drawers and compact content on every member dashboard", () => {
    for (const source of [companyDashboardSource, repDashboardSource, managerDashboardSource]) {
      expect(source).toContain("const [mobileMenuOpen, setMobileMenuOpen]");
      expect(source).toContain("fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-2.5rem))]");
      expect(source).toContain("lg:static lg:w-64 lg:translate-x-0");
      expect(source).toContain('className="sticky top-0 z-30 flex h-16');
    }
    expect(companyDashboardSource).toContain('className="p-4 sm:p-6 lg:p-8"');
    expect(repDashboardSource).toContain("grid grid-cols-2 gap-3 sm:grid-cols-4");
    expect(managerDashboardSource).toContain("grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4");
  });

  it("keeps public pages and account forms usable in narrow viewports", () => {
    expect(homeSource).toContain("text-5xl font-black text-primary mb-2 sm:text-7xl");
    expect(homeSource).toContain("Deslize para o lado para comparar as opções");
    expect(homeSource).toContain('min-w-[600px] w-full text-sm');
    expect(publicPageSources.BuscarRepresentantes).toContain("w-full min-w-0 max-w-full");
    expect(publicPageSources.OportunidadesReps).toContain("flex flex-col items-stretch justify-center gap-3 sm:flex-row");
    expect(publicPageSources.BlogPost).toContain('className="w-full overflow-x-auto"><table className="min-w-[560px]"');
    expect(publicPageSources.Planos).toContain('"grid-cols-1 sm:grid-cols-2 md:grid-cols-4"');
    expect(publicPageSources.ManagerPlans).toContain("flex flex-col gap-3 border-b border-white/10 px-4 py-3");
    expect(publicPageSources.Parcerias).toContain('hidden sm:inline">Falar no WhatsApp');
    expect(publicPageSources.Onboarding).toContain("grid grid-cols-1 gap-4 sm:grid-cols-2");
    expect(publicPageSources.VerificacaoKYC).toContain("flex flex-col gap-3 sm:flex-row");
    for (const name of ["Login", "Register", "RedefinirSenha", "Perfil"]) {
      expect(publicPageSources[name]).toContain("h-11 w-11");
    }
  });

  it("keeps shared loading, dialog, and ROI components inside the mobile viewport", () => {
    expect(dashboardSkeletonSource).toContain("hidden w-[280px]");
    expect(dashboardSkeletonSource).toContain("min-w-0 flex-1");
    expect(manusDialogSource).toContain("w-[calc(100vw-2rem)] max-w-[400px]");
    expect(roiCalculatorSource).toContain("bg-card p-5 sm:p-8");
    expect(roiCalculatorSource).toContain("grid grid-cols-3 gap-2 sm:gap-4");
  });

  it("uses a persuasive, non-empty preview before a representative is unlocked", () => {
    expect(dbSource).toContain("'Representante Comercial') AS fullName");
    expect(dbSource).toContain("String(row.fullName ?? row.nomeFantasia ?? '').trim() || 'Representante Comercial'");
    expect(companyDashboardSource).toContain('const previewName = String(rep.fullName');
    expect(companyDashboardSource).toContain("Contato protegido");
    expect(companyDashboardSource).toContain("Desbloquear contato");
    expect(companyDashboardSource).toContain("Dados públicos do perfil");
    expect(companyDashboardSource).toContain("Atividade principal");
    expect(companyDashboardSource).toContain("Informações verificadas");
    expect(companyDashboardSource).toContain("Você libera telefone, e-mail, cidade e apresentação profissional");
  });

  it("returns complete available details for contacts after they are unlocked", () => {
    expect(routersSource).toContain("myUnlockedContacts: protectedProcedure");
    expect(routersSource).toContain("importedCnpjMap");
    expect(routersSource).toContain("itemSnapshots");
    expect(routersSource).toContain("city: cityAndState || null");
    expect(companyDashboardSource).toContain("Contato desbloqueado");
    expect(companyDashboardSource).toContain("c.cnpj");
    expect(companyDashboardSource).toContain("c.address");
    expect(routersSource).toContain("consultarCnpj");
    expect(routersSource).toContain("liveCnpjMap");
    expect(companyDashboardSource).toContain("Telefone não informado");
    expect(companyDashboardSource).toContain("WhatsApp");
    expect(routersSource).toContain("resolveIbgeMunicipality");
    expect(routersSource).toContain("socialSearchTerm");
    expect(companyDashboardSource).toContain("Buscar LinkedIn");
    expect(companyDashboardSource).toContain("Buscar Instagram");
    expect(companyDashboardSource).toContain("CNAE");
    expect(companyDashboardSource).toContain("Contato direto");
    expect(companyDashboardSource).toContain("Localização");
    expect(companyDashboardSource).toContain("Dados da empresa");
    expect(companyDashboardSource).toContain("Abrir no mapa");
  });

  it("provides compliant B2B and B2C lead packages with manual PIX fulfillment", () => {
    expect(routersSource).toContain("leadPackages: router");
    expect(routersSource).toContain("legalConsent: z.literal(true)");
    expect(routersSource).toContain("lead_package_b2b_price");
    expect(mpRoutesSource).toContain('mpRouter.post("/lead-package-pix"');
    expect(mpRoutesSource).toContain('meta?.type === "lead_package"');
    expect(serverSource).toContain("CREATE TABLE IF NOT EXISTS lead_package_orders");
    expect(dashboardSource).toContain("Pacotes de leads B2B e B2C");
    expect(leadPackagesSource).toContain("1.000 ou 2.000 empresas");
    expect(leadPackagesSource).toContain("Tamanho do pacote");
    expect(routersSource).toContain("quantity: z.union([z.literal(1000), z.literal(2000)])");
    expect(leadPackagesSource).toContain('/register?purchase=leads&returnTo=/pacotes-leads');
    expect(publicPageSources.Register).toContain("getSafeReturnTo");
    expect(publicPageSources.Register).toContain('isLeadBuyerRegistration');
    expect(publicPageSources.Register).toContain('required={leadBuyer}');
    expect(leadPackagesSource).toContain("conformidade com a LGPD");
  });

  it("keeps pending PIX requests visible and resumable for campaigns and unlimited research", () => {
    expect(routersSource).toContain("myUnlimitedRequest: protectedProcedure");
    expect(routersSource).toContain('inArray(marketLeadAccesses.status, ["pending_payment", "pending_approval"])');
    expect(companyDashboardSource).toContain("Solicitação guardada no seu carrinho");
    expect(companyDashboardSource).toContain("Retomar pagamento PIX");
    expect(leadPackagesSource).toContain("resumeCampaignPayment");
    expect(leadPackagesSource).toContain("Retomar PIX");
    expect(leadPackagesSource).toContain('retomar") === "ilimitado"');
    expect(leadPackagesSource).toContain("PIX em análise");
  });

  it("gives admins a clear B2B/B2C campaign queue and manual PIX confirmation fallback", () => {
    expect(dashboardSource).toContain('label: "Campanhas B2B/B2C"');
    expect(dashboardSource).toContain("Confirmar PIX recebido");
    expect(dashboardSource).toContain("Campanhas B2B/B2C");
    expect(dashboardSource).toContain("confirmLeadPixMutation");
    expect(dashboardSource).toContain("confirmUnlimitedPixMutation");
    expect(routersSource).toContain("confirmLeadPix: protectedProcedure");
    expect(routersSource).toContain("confirmUnlimitedPix: protectedProcedure");
  });

  it("keeps issued PIX QR codes trackable and lets admins preview the B2B/B2C delivery data", () => {
    expect(leadPackagesSource).toContain("PIX_CHECKOUT_SESSION_KEY");
    expect(leadPackagesSource).toContain("sessionStorage.setItem(PIX_CHECKOUT_SESSION_KEY");
    expect(leadPackagesSource).toContain("closePixCheckout");
    expect(mpRoutesSource).toContain("QR Code PIX emitido pelo Mercado Pago");
    expect(routersSource).toContain("adminPreview: protectedProcedure");
    expect(dashboardSource).toContain("Dados que serão gerados no pacote");
    expect(dashboardSource).toContain("QR Code PIX emitido pelo Mercado Pago");
  });

  it("offers B2B/B2C package cards with a segment choice and carries the selection to the cart", () => {
    expect(companyDashboardSource).toContain("Pacotes para prospecção");
    expect(companyDashboardSource).toContain("Escolher pacote");
    expect(companyDashboardSource).toContain("Assinar e pagar por PIX");
    expect(companyDashboardSource).toContain("marketPackageSegment");
    expect(leadPackagesSource).toContain("requestedAudience");
    expect(leadPackagesSource).toContain("requestedQuantity");
    expect(leadPackagesSource).toContain("requestedSegment");
  });

  it("keeps commercial SEO indexable and removes generic job or review markup", () => {
    expect(seoSource).toContain("structuredData?:");
    expect(leadPackagesSource).toContain('canonical="/pacotes-leads"');
    expect(leadPackagesSource).toContain('"@type": "Service"');
    expect(sitemapSource).toContain("https://repmatch.com.br/pacotes-leads");
    expect(robotsSource).toContain("Allow: /pacotes-leads");
    expect(homeSource).toContain('href="/pacotes-leads"');
    expect(homeSource).toContain("trpc.cnpjBase.stats.useQuery()");
    expect(homeSource).toContain("173 mil representantes comerciais");
    expect(publicPageSources.Parcerias).not.toContain("173k+");
    expect(brazilMapSource).toContain("end={173987}");
    expect(indexHtmlSource).not.toContain('"@type": "JobPosting"');
    expect(indexHtmlSource).not.toContain('"aggregateRating"');
  });
});
