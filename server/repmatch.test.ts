import { describe, expect, it } from "vitest";
import { calculateMatchScore } from "./db";

// ─── Match Score Tests ────────────────────────────────────────────────────────
describe("calculateMatchScore", () => {
  const baseRep = {
    id: 1,
    userId: 1,
    fullName: "João Silva",
    phone: null,
    region: "SP",
    segment: "Alimentos",
    experienceYears: 5,
    bio: null,
    isActive: true,
    subscriptionTier: "free" as const,
    rankScore: 0,
    responseRate: 100,
    totalApplications: 0,
    successfulHires: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const baseJob = {
    id: 1,
    companyId: 1,
    title: "Representante SP",
    description: "Vaga para representante em SP",
    commissionPercentage: "10",
    region: "SP",
    segment: "Alimentos",
    minTierRequired: "free" as const,
    isFeatured: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("returns 95 when region, segment, experience and active all match (without KYC/CORE)", () => {
    const score = calculateMatchScore(baseRep, baseJob);
    expect(score).toBe(95); // 40+30+20+5
  });

  it("returns 100 when all criteria match including KYC and CORE", () => {
    const score = calculateMatchScore(
      { ...baseRep, kycStatus: "approved", coreStatus: "active" },
      baseJob
    );
    expect(score).toBe(100); // 40+30+20+5+3+2
  });

  it("returns 45 when only region and active status match", () => {
    const score = calculateMatchScore(
      { ...baseRep, segment: "Tecnologia", experienceYears: 1 },
      baseJob
    );
    expect(score).toBe(45); // region(40) + active(5)
  });

  it("returns 0 for inactive rep with no matches", () => {
    const score = calculateMatchScore(
      { ...baseRep, region: "RJ", segment: "Tecnologia", isActive: false, experienceYears: 1 },
      baseJob
    );
    expect(score).toBe(0);
  });

  it("returns 90 when region and segment and experience match but rep is inactive", () => {
    const score = calculateMatchScore(
      { ...baseRep, isActive: false },
      baseJob
    );
    expect(score).toBe(90); // region(40) + segment(30) + experience(20)
  });

  it("returns 75 when region, segment and active match but experience < 3", () => {
    const score = calculateMatchScore(
      { ...baseRep, experienceYears: 2 },
      baseJob
    );
    expect(score).toBe(75); // region(40) + segment(30) + active(5)
  });
});

// ─── Auth Logout Tests ───────────────────────────────────────────────────────
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type CookieCall = { name: string; options: Record<string, unknown> };
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "email:test@repmatch.com",
    email: "test@repmatch.com",
    name: "Test User",
    passwordHash: null,
    role: "user",
    userType: "pending",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears rm_session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    // Only rm_session is cleared (own auth — no Manus OAuth cookie)
    expect(clearedCookies).toHaveLength(1);
    const rmCookie = clearedCookies.find(c => c.name === "rm_session");
    expect(rmCookie).toBeDefined();
    expect(rmCookie?.options).toMatchObject({ path: "/", maxAge: -1 });
  });
});
