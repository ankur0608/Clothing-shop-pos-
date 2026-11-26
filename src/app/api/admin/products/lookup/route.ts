import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim();

    if (!code) {
      return NextResponse.json(
        { error: "Barcode or SKU code is required" },
        { status: 400 }
      );
    }

    // 1. Try finding by variant barcode or variant SKU
    const matchedVariant = await prisma.productVariant.findFirst({
      where: {
        OR: [{ barcode: code }, { sku: code }],
      },
      include: {
        product: {
          include: {
            variants: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (matchedVariant) {
      return NextResponse.json({
        found: true,
        matchType: "VARIANT",
        product: matchedVariant.product,
        matchedVariant: {
          id: matchedVariant.id,
          sku: matchedVariant.sku,
          barcode: matchedVariant.barcode,
          size: matchedVariant.size,
          color: matchedVariant.color,
          price: Number(matchedVariant.price),
          costPrice: Number(matchedVariant.costPrice),
          stock: matchedVariant.stock,
          isActive: matchedVariant.isActive,
        },
      });
    }

    // 2. Try finding by product barcode or product SKU
    const matchedProduct = await prisma.product.findFirst({
      where: {
        OR: [{ barcode: code }, { sku: code }],
      },
      include: {
        variants: {
          where: { isActive: true },
        },
      },
    });

    if (matchedProduct) {
      return NextResponse.json({
        found: true,
        matchType: "PRODUCT",
        product: matchedProduct,
        matchedVariant:
          matchedProduct.variants && matchedProduct.variants.length > 0
            ? {
                id: matchedProduct.variants[0].id,
                sku: matchedProduct.variants[0].sku,
                barcode: matchedProduct.variants[0].barcode,
                size: matchedProduct.variants[0].size,
                color: matchedProduct.variants[0].color,
                price: Number(matchedProduct.variants[0].price),
                costPrice: Number(matchedProduct.variants[0].costPrice),
                stock: matchedProduct.variants[0].stock,
                isActive: matchedProduct.variants[0].isActive,
              }
            : null,
      });
    }

    return NextResponse.json(
      {
        found: false,
        error: `No product found matching barcode or SKU "${code}"`,
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Barcode lookup error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to lookup barcode" },
      { status: 500 }
    );
  }
}
