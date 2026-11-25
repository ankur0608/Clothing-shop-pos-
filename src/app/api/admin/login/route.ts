import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signAdminToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Fetch admin record
    const admin = await prisma.admin.findUnique({
      where: { email: cleanEmail },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!admin.isActive) {
      return NextResponse.json(
        { error: "This admin account has been disabled. Please contact super admin." },
        { status: 403 }
      );
    }

    // 2. Verify hashed password
    const isPasswordValid = await verifyPassword(password, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 3. Extract client metadata
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Unknown browser";

    const now = new Date();

    // 4. Create Login History Log
    const log = await prisma.adminLoginLog.create({
      data: {
        adminId: admin.id,
        loginAt: now,
        ipAddress: ip,
        userAgent: userAgent.slice(0, 255),
        status: "ACTIVE",
      },
    });

    // 5. Update Admin status: online = true, lastLoginAt = now
    const updatedAdmin = await prisma.admin.update({
      where: { id: admin.id },
      data: {
        isOnline: true,
        lastLoginAt: now,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isOnline: true,
        lastLoginAt: true,
        lastLogoutAt: true,
      },
    });

    // 6. Sign JWT
    const token = await signAdminToken({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      logId: log.id,
    });

    const response = NextResponse.json({
      success: true,
      message: "Admin authenticated successfully",
      admin: updatedAdmin,
    });

    // 7. Set HTTP-Only Cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });

    return response;
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during login" },
      { status: 500 }
    );
  }
}
