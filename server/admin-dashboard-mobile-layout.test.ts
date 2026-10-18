import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const dashboardPath = path.resolve(process.cwd(), "client/src/pages/AdminDashboard.tsx");
const dashboardSource = fs.readFileSync(dashboardPath, "utf8");
const companyDashboardSource = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/CompanyDashboard.tsx"), "utf8");
const mpRoutesSource = fs.readFileSync(path.resolve(process.cwd(), "server/mercadopago/mpRoutes.ts"), "utf8");
const sharedConstantsSource = fs.readFileSync(path.resolve(process.cwd(), "shared/const.ts"), "utf8");
const routersSource = fs.readFileSync(path.resolve(process.cwd(), "server/routers.ts"), "utf8");
const serverSource = fs.readFileSync(path.resolve(process.cwd(), "server/_core/index.ts"), "utf8");

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
    expect(dashboardSource).toContain("Central Comercial");
    expect(dashboardSource).toContain("Carrinhos abandonados");
    expect(dashboardSource).toContain("Ver cadastros");
    expect(dashboardSource).toContain("Voltar ao painel");
  });
});
