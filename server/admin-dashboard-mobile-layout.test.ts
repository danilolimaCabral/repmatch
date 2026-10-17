import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const dashboardPath = path.resolve(process.cwd(), "client/src/pages/AdminDashboard.tsx");
const dashboardSource = fs.readFileSync(dashboardPath, "utf8");

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
});
