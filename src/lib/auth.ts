import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const jwtSecretEnv = process.env.JWT_SECRET;
if (!jwtSecretEnv && process.env.NODE_ENV === "production") {
  throw new Error("FATAL: JWT_SECRET environment variable is missing in production environment.");
}

const JWT_SECRET = new TextEncoder().encode(
  jwtSecretEnv || "clothing-shop-pos-super-secret-jwt-key-2026-secure"
);

export const COOKIE_NAME = "admin_auth_token";

export interface AdminTokenPayload {
  adminId: string;
  email: string;
  role: string;
  logId?: string;
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function verifyPassword(plainText: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

export async function signAdminToken(payload: AdminTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(JWT_SECRET);
}

export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AdminTokenPayload;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyAdminToken(token);
  if (!payload?.adminId) return null;

  const admin = await prisma.admin.findUnique({
    where: { id: payload.adminId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isOnline: true,
      isActive: true,
      lastLoginAt: true,
      lastLogoutAt: true,
      createdAt: true,
    },
  });

  if (!admin || !admin.isActive) return null;

  return {
    admin,
    logId: payload.logId,
  };
}
