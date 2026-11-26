import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, orderAmount } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Invalid coupon code" }, { status: 404 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ valid: false, error: "This coupon is no longer active" }, { status: 400 });
    }

    const now = new Date();
    if (new Date(coupon.endDate) < now) {
      return NextResponse.json({ valid: false, error: "This coupon has expired" }, { status: 400 });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, error: "Coupon usage limit has been reached" }, { status: 400 });
    }

    const subtotal = Number(orderAmount) || 0;
    const minAmount = coupon.minOrderAmount ? Number(coupon.minOrderAmount) : 0;
    if (subtotal < minAmount) {
      return NextResponse.json({
        valid: false,
        error: `Minimum order amount of ₹${minAmount.toFixed(2)} required for this coupon`,
      }, { status: 400 });
    }

    let discountAmount = 0;
    const discountVal = Number(coupon.discountValue);
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (subtotal * discountVal) / 100;
    } else {
      discountAmount = Math.min(discountVal, subtotal);
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: discountVal,
        discountAmount: Math.round(discountAmount * 100) / 100,
      },
    });
  } catch (error: any) {
    console.error("Coupon validation error:", error);
    return NextResponse.json({ error: error.message || "Failed to validate coupon" }, { status: 500 });
  }
}
