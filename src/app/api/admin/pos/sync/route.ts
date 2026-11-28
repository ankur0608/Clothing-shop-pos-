import { NextRequest, NextResponse } from "next/server";
import { pushMobileScan, getNewScans } from "@/lib/pos-sync";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Laptop polls this to receive scans from phone
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const since = parseInt(searchParams.get("since") || "0", 10);

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const scans = getNewScans(sessionId, since);

    return NextResponse.json({
      success: true,
      scans,
      serverTime: Date.now(),
    });
  } catch (error: any) {
    console.error("POS sync GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to poll scans" },
      { status: 500 }
    );
  }
}

// Mobile phone sends this when it scans a barcode
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, barcode } = body;

    if (!sessionId || !barcode) {
      return NextResponse.json(
        { error: "sessionId and barcode are required" },
        { status: 400 }
      );
    }

    const cleanCode = barcode.trim();
    const scanEvent = pushMobileScan(sessionId, cleanCode);

    // Also lookup product info so the mobile phone can show instant feedback
    let productInfo: any = null;
    try {
      // 1. Variant lookup
      const matchedVariant = await prisma.productVariant.findFirst({
        where: {
          OR: [{ barcode: cleanCode }, { sku: cleanCode }],
        },
        include: {
          product: true,
        },
      });

      if (matchedVariant) {
        productInfo = {
          name: matchedVariant.product.name,
          category: matchedVariant.product.category,
          sku: matchedVariant.sku,
          size: matchedVariant.size,
          color: matchedVariant.color,
          price: Number(matchedVariant.price),
          stock: matchedVariant.stock,
          isVariant: true,
        };
      } else {
        // 2. Base product lookup
        const matchedProduct = await prisma.product.findFirst({
          where: {
            OR: [{ barcode: cleanCode }, { sku: cleanCode }],
          },
        });

        if (matchedProduct) {
          productInfo = {
            name: matchedProduct.name,
            category: matchedProduct.category,
            sku: matchedProduct.sku,
            price: Number(matchedProduct.price),
            stock: matchedProduct.stock,
            isVariant: false,
          };
        }
      }
    } catch (dbErr) {
      console.warn("DB lookup in mobile sync:", dbErr);
    }

    return NextResponse.json({
      success: true,
      scanEvent,
      productInfo,
      message: productInfo
        ? `Added ${productInfo.name} ${productInfo.size ? `(${productInfo.size})` : ""} to laptop POS bill!`
        : `Sent barcode ${cleanCode} to laptop POS!`,
    });
  } catch (error: any) {
    console.error("POS sync POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to push scan" },
      { status: 500 }
    );
  }
}
