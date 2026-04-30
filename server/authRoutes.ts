import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env";

const JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret || "repmatch-secret-key-2024");
const RM_COOKIE = "rm_session";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1 year
};

async function signToken(userId: number): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1y")
    .sign(JWT_SECRET);
}

export function registerAuthRoutes(app: Express) {
  // POST /api/auth/register
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
      if (!email || !password || !name) {
        res.status(400).json({ error: "Nome, email e senha são obrigatórios." });
        return;
      }
      if (password.length < 6) {
        res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });
        return;
      }

      const db = await getDb();
      if (!db) { res.status(500).json({ error: "DB unavailable" }); return; }

      // Check if email already exists
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (existing.length > 0) {
        res.status(409).json({ error: "Este e-mail já está cadastrado." });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      // openId is required (unique) — use email as synthetic openId for own-auth users
      const openId = `email:${email}`;

      await db.insert(users).values({
        openId,
        name,
        email,
        passwordHash,
        lastSignedIn: new Date(),
      });

      const newUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const user = newUser[0];
      if (!user) { res.status(500).json({ error: "Erro ao criar usuário." }); return; }

      const token = await signToken(user.id);
      res.cookie(RM_COOKIE, token, COOKIE_OPTS);
      res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, userType: user.userType } });
    } catch (err) {
      console.error("[Auth] Register error:", err);
      res.status(500).json({ error: "Erro interno ao registrar." });
    }
  });

  // POST /api/auth/login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };
      if (!email || !password) {
        res.status(400).json({ error: "E-mail e senha são obrigatórios." });
        return;
      }

      const db = await getDb();
      if (!db) { res.status(500).json({ error: "DB unavailable" }); return; }

      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const user = result[0];

      if (!user || !user.passwordHash) {
        res.status(401).json({ error: "E-mail ou senha incorretos." });
        return;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "E-mail ou senha incorretos." });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ error: "Conta desativada. Entre em contato com o suporte." });
        return;
      }

      // Update lastSignedIn
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

      const token = await signToken(user.id);
      res.cookie(RM_COOKIE, token, COOKIE_OPTS);
      res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, userType: user.userType } });
    } catch (err) {
      console.error("[Auth] Login error:", err);
      res.status(500).json({ error: "Erro interno ao fazer login." });
    }
  });

  // POST /api/auth/logout
  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    res.clearCookie(RM_COOKIE, { path: "/" });
    res.json({ success: true });
  });

  // GET /api/auth/me
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const cookieHeader = req.headers.cookie || "";
      const match = cookieHeader.match(/(?:^|;\s*)rm_session=([^;]+)/);
      if (!match) { res.json(null); return; }
      const token = decodeURIComponent(match[1]);
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const userId = payload.userId as number;
      if (!userId) { res.json(null); return; }

      const db = await getDb();
      if (!db) { res.json(null); return; }
      const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const user = result[0];
      if (!user || !user.isActive) { res.json(null); return; }
      res.json({ id: user.id, name: user.name, email: user.email, role: user.role, userType: user.userType });
    } catch {
      res.json(null);
    }
  });
}
