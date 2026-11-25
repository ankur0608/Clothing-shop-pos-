import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const now = new Date();

    if (token) {
      const payload = await verifyAdminToken(token);
      if (payload?.adminId) {
        // 1. Mark Admin as offline and set lastLogoutAt
        await prisma.admin.update({
          where: { id: payload.adminId },
          data: {
            isOnline: false,
            lastLogoutAt: now,
          },
        }).catch((err) => console.warn("Admin update on logout warning:", err));

        // 2. Close the specific session log if exists
        if (payload.logId) {
          await prisma.adminLoginLog.update({
            where: { id: payload.logId },
            data: {
              logoutAt: now,
              status: "LOGGED_OUT",
            },
          }).catch((err) => console.warn("Admin log update on logout warning:", err));
        }
      }
    }

    const response = NextResponse.json({
      success: true,
      message: "Admin logged out successfully",
    });

    // Clear the auth cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    console.error("Logout API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal error during logout" },
      { status: 500 }
    );
  }
}
