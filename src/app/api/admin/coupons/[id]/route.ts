import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const data: any = {};
    if (body.code !== undefined) {
      const cleanCode = body.code.trim().toUpperCase();
      const existing = await prisma.coupon.findFirst({
        where: {
          code: cleanCode,
          NOT: { id },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Coupon code '${cleanCode}' is already in use by another coupon` },
          { status: 400 }
        );
      }
      data.code = cleanCode;
    }
    if (body.description !== undefined) data.description = body.description?.trim() || null;
    if (body.discountType !== undefined) data.discountType = body.discountType;
    if (body.discountValue !== undefined) data.discountValue = Number(body.discountValue);
    if (body.minOrderAmount !== undefined) data.minOrderAmount = Number(body.minOrderAmount);
    if (body.startDate !== undefined) data.startDate = new Date(body.startDate);
    if (body.neverExpires) {
      data.endDate = new Date("2099-12-31T23:59:59.000Z");
    } else if (body.endDate !== undefined) {
      data.endDate = new Date(body.endDate);
    }
    if (body.isUnlimited) {
      data.usageLimit = 0;
    } else if (body.usageLimit !== undefined) {
      data.usageLimit = parseInt(body.usageLimit, 10);
    }
    if (body.usedCount !== undefined) data.usedCount = parseInt(body.usedCount, 10);
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    const updated = await prisma.coupon.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      message: "Coupon updated successfully",
      coupon: updated,
    });
  } catch (error: any) {
    console.error("Update Coupon Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update coupon" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete Coupon Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
