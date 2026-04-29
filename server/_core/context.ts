import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { jwtVerify } from "jose";
import { getUserById } from "../db";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

const RM_COOKIE_NAME = "rm_session";
const JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret || "repmatch-secret-key-2024");

async function getCustomAuthUser(req: CreateExpressContextOptions["req"]): Promise<User | null> {
  try {
    const cookieHeader = req.headers.cookie || "";
    // Parse rm_session cookie
    const match = cookieHeader.match(/(?:^|;\s*)rm_session=([^;]+)/);
    if (!match) return null;
    const token = decodeURIComponent(match[1]);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as number;
    if (!userId) return null;
    const user = await getUserById(userId);
    return user ?? null;
  } catch {
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  
  // First try custom auth (rm_session JWT)
  user = await getCustomAuthUser(opts.req);
  
  // Fall back to Manus OAuth (app_session_id)
  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      user = null;
    }
  }
  
  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
