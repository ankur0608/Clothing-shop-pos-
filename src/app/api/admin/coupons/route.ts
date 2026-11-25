import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!prisma?.coupon) {
      console.warn("Prisma Coupon model not initialized. Returning fallback empty array.");
      return NextResponse.json({
        success: true,
        coupons: [],
        fallback: true,
      });
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, coupons: coupons || [] });
  } catch (error: any) {
    console.error("Fetch Coupons Error:", error);
    return NextResponse.json({
      success: true,
      coupons: [],
      fallback: true,
      warning: error?.message || "Failed to fetch coupons",
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      startDate,
      endDate,
      usageLimit,
      isActive,
      neverExpires,
      isUnlimited,
    } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    // Check existing code
    const existing = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Coupon code '${cleanCode}' already exists` },
        { status: 400 }
      );
    }

    const finalEndDate = neverExpires || !endDate 
      ? new Date("2099-12-31T23:59:59.000Z") 
      : new Date(endDate);

    const finalUsageLimit = isUnlimited 
      ? 0 
      : (usageLimit !== undefined && usageLimit !== "" ? parseInt(usageLimit, 10) : 100);

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        description: description?.trim() || null,
        discountType: discountType === "FIXED" ? "FIXED" : "PERCENTAGE",
        discountValue: discountValue !== "" && !isNaN(Number(discountValue)) ? Number(discountValue) : 0,
        minOrderAmount: minOrderAmount !== "" && !isNaN(Number(minOrderAmount)) ? Number(minOrderAmount) : 0,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: finalEndDate,
        usageLimit: isNaN(finalUsageLimit) ? 0 : finalUsageLimit,
        usedCount: 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error: any) {
    console.error("Create Coupon Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create coupon" },
      { status: 500 }
    );
  }
}
