import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { randomBytes } from "crypto";
import { getDb } from "./db";
import { users, passwordResetTokens } from "../drizzle/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { ENV } from "./_core/env";
import { notifyOwner } from "./_core/notification";

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

function generateToken(): string {
  return randomBytes(48).toString("hex"); // 96-char hex string
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
      const openId = `email:${email}`;
      const emailVerificationToken = generateToken();
      await db.insert(users).values({
        openId,
        name,
        email,
        passwordHash,
        emailVerified: false,
        emailVerificationToken,
        lastSignedIn: new Date(),
      });
      const [newUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!newUser) { res.status(500).json({ error: "Erro ao criar usuário." }); return; }
      const token = await signToken(newUser.id);
      res.cookie(RM_COOKIE, token, COOKIE_OPTS);
      // Notify owner with verification link
      const origin = (req.headers.origin as string) || `https://${req.headers.host}`;
      const verifyUrl = `${origin}/verificar-email?token=${emailVerificationToken}`;
      notifyOwner({
        title: `📧 Novo cadastro: ${name}`,
        content: `Novo usuário: ${name} (${email})\n\nLink de verificação de e-mail (encaminhe ao usuário):\n${verifyUrl}`,
      }).catch(() => {});
      res.json({
        success: true,
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, userType: newUser.userType, emailVerified: false },
      });
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
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
      const token = await signToken(user.id);
      res.cookie(RM_COOKIE, token, COOKIE_OPTS);
      res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, userType: user.userType, emailVerified: user.emailVerified } });
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
      res.json({ id: user.id, name: user.name, email: user.email, role: user.role, userType: user.userType, emailVerified: user.emailVerified });
    } catch {
      res.json(null);
    }
  });

  // POST /api/auth/forgot-password
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body as { email?: string };
      if (!email) {
        res.status(400).json({ error: "E-mail é obrigatório." });
        return;
      }
      const db = await getDb();
      if (!db) { res.status(500).json({ error: "DB unavailable" }); return; }
      const [user] = await db.select({ id: users.id, name: users.name, email: users.email })
        .from(users).where(eq(users.email, email)).limit(1);
      // Always return success to avoid user enumeration
      const successMsg = { success: true, message: "Se este e-mail estiver cadastrado, você receberá as instruções em breve." };
      if (!user) { res.json(successMsg); return; }
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await db.insert(passwordResetTokens).values({ userId: user.id, token, expiresAt });
      const origin = (req.headers.origin as string) || `https://${req.headers.host}`;
      const resetUrl = `${origin}/redefinir-senha?token=${token}`;
      // Notify owner — since no SMTP, owner forwards the link to the user
      notifyOwner({
        title: `🔑 Redefinição de senha: ${user.name}`,
        content: `${user.name} (${user.email}) solicitou redefinição de senha.\n\nLink (válido por 1h):\n${resetUrl}\n\nEncaminhe este link ao usuário por WhatsApp ou e-mail.`,
      }).catch(() => {});
      res.json({ ...successMsg, resetUrl }); // resetUrl included for dev/testing convenience
    } catch (err) {
      console.error("[Auth] Forgot password error:", err);
      res.status(500).json({ error: "Erro interno." });
    }
  });

  // POST /api/auth/reset-password
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body as { token?: string; newPassword?: string };
      if (!token || !newPassword) {
        res.status(400).json({ error: "Token e nova senha são obrigatórios." });
        return;
      }
      if (newPassword.length < 8) {
        res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres." });
        return;
      }
      const db = await getDb();
      if (!db) { res.status(500).json({ error: "DB unavailable" }); return; }
      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(and(
          eq(passwordResetTokens.token, token),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date())
        ))
        .limit(1);
      if (!resetToken) {
        res.status(400).json({ error: "Token inválido ou expirado. Solicite um novo link." });
        return;
      }
      const passwordHash = await bcrypt.hash(newPassword, 12);
      await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, resetToken.userId));
      await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, resetToken.id));
      res.json({ success: true, message: "Senha redefinida com sucesso. Faça login com a nova senha." });
    } catch (err) {
      console.error("[Auth] Reset password error:", err);
      res.status(500).json({ error: "Erro interno." });
    }
  });

  // POST /api/auth/verify-email
  app.post("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { token } = req.body as { token?: string };
      if (!token) {
        res.status(400).json({ error: "Token é obrigatório." });
        return;
      }
      const db = await getDb();
      if (!db) { res.status(500).json({ error: "DB unavailable" }); return; }
      const [user] = await db
        .select({ id: users.id, emailVerified: users.emailVerified })
        .from(users)
        .where(eq(users.emailVerificationToken, token))
        .limit(1);
      if (!user) {
        res.status(400).json({ error: "Token de verificação inválido." });
        return;
      }
      if (user.emailVerified) {
        res.json({ success: true, message: "E-mail já verificado." });
        return;
      }
      await db.update(users)
        .set({ emailVerified: true, emailVerificationToken: null, updatedAt: new Date() })
        .where(eq(users.id, user.id));
      res.json({ success: true, message: "E-mail verificado com sucesso!" });
    } catch (err) {
      console.error("[Auth] Verify email error:", err);
      res.status(500).json({ error: "Erro interno." });
    }
  });
}
