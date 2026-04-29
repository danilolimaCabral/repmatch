import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { ENV } from "./_core/env";

const router = Router();
const COOKIE_NAME = "rm_session";
const JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret || "repmatch-secret-key-2024");

function getCookieOptions(req: Request) {
  const isSecure = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https";
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? ("none" as const) : ("lax" as const),
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  };
}

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password, userType } = req.body;

    if (!name || !email || !password || !userType) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }
    if (!["representative", "company"].includes(userType)) {
      return res.status(400).json({ error: "Tipo de usuário inválido." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });
    }

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados indisponível." });

    // Check if email already exists
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Este e-mail já está cadastrado." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const openId = `local_${nanoid(16)}`;

    await db.insert(users).values({
      openId,
      name,
      email,
      passwordHash,
      loginMethod: "email",
      userType: userType as "representative" | "company",
      role: "user",
      emailVerified: true,
      lastSignedIn: new Date(),
    });

    const newUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = newUser[0];

    const token = await new SignJWT({ userId: user.id, email: user.email, userType: user.userType, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(JWT_SECRET);

    res.cookie(COOKIE_NAME, token, getCookieOptions(req));
    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[Auth] Register error:", err);
    return res.status(500).json({ error: "Erro interno ao criar conta." });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados indisponível." });

    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = result[0];

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    // Update lastSignedIn
    await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

    const token = await new SignJWT({ userId: user.id, email: user.email, userType: user.userType, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(JWT_SECRET);

    res.cookie(COOKIE_NAME, token, getCookieOptions(req));
    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[Auth] Login error:", err);
    return res.status(500).json({ error: "Erro interno ao fazer login." });
  }
});

// POST /api/auth/logout
router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  return res.json({ success: true });
});

// GET /api/auth/me
router.get("/me", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.json(null);

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const db = await getDb();
    if (!db) return res.json(null);

    const result = await db.select().from(users).where(eq(users.id, payload.userId as number)).limit(1);
    const user = result[0];
    if (!user) return res.json(null);

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      role: user.role,
    });
  } catch {
    return res.json(null);
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "E-mail obrigatório." });

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados indisponível." });

    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    // Always return success to avoid email enumeration
    if (result.length === 0) return res.json({ success: true });

    const resetToken = nanoid(32);
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await db.update(users).set({ resetToken, resetTokenExpiry }).where(eq(users.email, email));

    // In production, send email here. For now, return token in response (dev only).
    console.log(`[Auth] Reset token for ${email}: ${resetToken}`);
    return res.json({ success: true, message: "Se o e-mail existir, você receberá as instruções em breve." });
  } catch (err) {
    console.error("[Auth] Forgot password error:", err);
    return res.status(500).json({ error: "Erro interno." });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: "Token e senha obrigatórios." });
    if (password.length < 6) return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados indisponível." });

    const result = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);
    const user = result[0];

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return res.status(400).json({ error: "Token inválido ou expirado." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db.update(users).set({ passwordHash, resetToken: null, resetTokenExpiry: null }).where(eq(users.id, user.id));

    return res.json({ success: true });
  } catch (err) {
    console.error("[Auth] Reset password error:", err);
    return res.status(500).json({ error: "Erro interno." });
  }
});

export default router;
