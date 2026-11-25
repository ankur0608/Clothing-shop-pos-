import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email || "admin@pos.com").trim().toLowerCase();
    const password = body.password || "Admin@12345";
    const name = body.name || "Store Administrator";
    const role = body.role || "SUPER_ADMIN";

    const hashedPassword = await hashPassword(password);

    // 1. Upsert Admin
    const admin = await prisma.admin.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        isActive: true,
      },
      create: {
        name,
        email,
        password: hashedPassword,
        role,
        isActive: true,
        isOnline: false,
      },
    });

    // 2. Upsert Sample Product with Variants demonstrating:
    // Black color shirt is higher price (₹48.00) than Blue color shirt (₹38.00), with distinct size & color combo pricing and stock
    const product = await prisma.product.upsert({
      where: { sku: "OXF-SHIRT-01" },
      update: {},
      create: {
        name: "Classic Oxford Cotton Shirt",
        sku: "OXF-SHIRT-01",
        barcode: "890123456789",
        category: "Men",
        price: 38.0, // starting/min price
        costPrice: 16.0,
        size: "M, L, XL",
        color: "Black, Blue, White",
        stock: 130,
        isActive: true,
        variants: {
          create: [
            {
              sku: "OXF-BLK-M",
              barcode: "890123456001",
              size: "M",
              color: "Black",
              price: 48.0, // Black color is more price (₹48)
              costPrice: 20.0,
              stock: 25,
              isActive: true,
            },
            {
              sku: "OXF-BLK-L",
              barcode: "890123456002",
              size: "L",
              color: "Black",
              price: 48.0,
              costPrice: 20.0,
              stock: 20,
              isActive: true,
            },
            {
              sku: "OXF-BLK-XL",
              barcode: "890123456003",
              size: "XL",
              color: "Black",
              price: 52.0, // XL combo is also different price (₹52)
              costPrice: 22.0,
              stock: 15,
              isActive: true,
            },
            {
              sku: "OXF-BLU-M",
              barcode: "890123456004",
              size: "M",
              color: "Blue",
              price: 38.0, // Blue color shirt is lower price (₹38)
              costPrice: 16.0,
              stock: 30,
              isActive: true,
            },
            {
              sku: "OXF-BLU-L",
              barcode: "890123456005",
              size: "L",
              color: "Blue",
              price: 38.0,
              costPrice: 16.0,
              stock: 22,
              isActive: true,
            },
            {
              sku: "OXF-WHT-M",
              barcode: "890123456006",
              size: "M",
              color: "White",
              price: 42.0,
              costPrice: 18.0,
              stock: 18,
              isActive: true,
            },
          ],
        },
      },
      include: {
        variants: true,
      },
    });

    // 3. Upsert Sample Coupon with date, usedCount, usageLimit, isActive
    const coupon = await prisma.coupon.upsert({
      where: { code: "WELCOME20" },
      update: {},
      create: {
        code: "WELCOME20",
        description: "20% off for first-time store shoppers",
        discountType: "PERCENTAGE",
        discountValue: 20,
        minOrderAmount: 40,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        usageLimit: 200,
        usedCount: 14,
        isActive: true,
      },
    });

    return NextResponse.json({
      message: "Database seeded successfully with Admin, Product, and Coupon",
      credentials: { email, password },
      seeded: {
        admin: { email: admin.email, role: admin.role },
        product: { name: product.name, sku: product.sku, isActive: product.isActive },
        coupon: {
          code: coupon.code,
          endDate: coupon.endDate,
          usedCount: coupon.usedCount,
          usageLimit: coupon.usageLimit,
          isActive: coupon.isActive,
        },
      },
    });
  } catch (error: any) {
    console.error("Seed Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to seed database" },
      { status: 500 }
    );
  }
}
