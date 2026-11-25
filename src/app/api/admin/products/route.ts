import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const size = searchParams.get("size") || "";
    const color = searchParams.get("color") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
        { variants: { some: { sku: { contains: search, mode: "insensitive" } } } },
      ];
    }
    if (category) {
      where.category = category;
    }
    if (size) {
      where.OR = [
        ...(where.OR || []),
        { size: { contains: size, mode: "insensitive" } },
        { variants: { some: { size: { equals: size, mode: "insensitive" } } } },
      ];
    }
    if (color) {
      where.OR = [
        ...(where.OR || []),
        { color: { contains: color, mode: "insensitive" } },
        { variants: { some: { color: { contains: color, mode: "insensitive" } } } },
      ];
    }

    if (!prisma?.product) {
      console.warn("Prisma Product model not initialized. Returning fallback empty array.");
      return NextResponse.json({
        success: true,
        products: [],
        fallback: true,
      });
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        variants: {
          orderBy: [{ color: "asc" }, { size: "asc" }],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, products: products || [] });
  } catch (error: any) {
    console.error("Fetch Products Error:", error);
    // Return empty fallback array so admin dashboard can render "no products" state cleanly instead of breaking
    return NextResponse.json({
      success: true,
      products: [],
      fallback: true,
      warning: error?.message || "Failed to fetch products",
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
      name,
      sku,
      barcode,
      category,
      price,
      costPrice,
      size,
      color,
      stock,
      isActive,
      variants,
    } = body;

    if (!name || !sku) {
      return NextResponse.json(
        { error: "Product name and SKU are required" },
        { status: 400 }
      );
    }

    const cleanSku = sku.trim().toUpperCase();

    // Check duplicate SKU
    const existing = await prisma.product.findUnique({
      where: { sku: cleanSku },
    });
    if (existing) {
      return NextResponse.json(
        { error: `SKU '${cleanSku}' already exists` },
        { status: 400 }
      );
    }

    const hasVariants = Array.isArray(variants) && variants.length > 0;

    // Normalize size & color
    let finalSizes = Array.isArray(size)
      ? size.join(", ")
      : typeof size === "string"
      ? size.trim()
      : null;

    let finalColors = Array.isArray(color)
      ? color.join(", ")
      : typeof color === "string"
      ? color.trim()
      : null;

    let totalStock = parseInt(stock, 10) || 0;
    let basePrice = Number(price) || 0;
    let baseCost = Number(costPrice) || 0;

    let variantData: any[] = [];
    if (hasVariants) {
      const distinctSizes = Array.from(new Set(variants.map((v: any) => v.size?.trim()).filter(Boolean)));
      const distinctColors = Array.from(new Set(variants.map((v: any) => v.color?.trim()).filter(Boolean)));
      if (distinctSizes.length > 0) finalSizes = distinctSizes.join(", ");
      if (distinctColors.length > 0) finalColors = distinctColors.join(", ");

      totalStock = variants.reduce((sum: number, v: any) => sum + (parseInt(v.stock, 10) || 0), 0);
      const prices = variants.map((v: any) => Number(v.price)).filter((p: number) => !isNaN(p) && p > 0);
      if (prices.length > 0) {
        basePrice = Math.min(...prices);
      }

      variantData = variants.map((v: any, index: number) => {
        const vSize = v.size?.trim() || "M";
        const vColor = v.color?.trim() || "Standard";
        const vSku = v.sku?.trim().toUpperCase() || `${cleanSku}-${vColor.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase()}-${vSize}-${index + 1}`;
        return {
          sku: vSku,
          barcode: v.barcode?.trim() || null,
          size: vSize,
          color: vColor,
          price: Number(v.price) || basePrice,
          costPrice: Number(v.costPrice) || baseCost,
          stock: parseInt(v.stock, 10) || 0,
          isActive: v.isActive !== undefined ? Boolean(v.isActive) : true,
        };
      });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        sku: cleanSku,
        barcode: barcode?.trim() || null,
        category: category?.trim() || "General",
        price: basePrice,
        costPrice: baseCost,
        size: finalSizes,
        color: finalColors,
        stock: totalStock,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        ...(hasVariants
          ? {
              variants: {
                create: variantData,
              },
            }
          : {}),
      },
      include: {
        variants: {
          orderBy: [{ color: "asc" }, { size: "asc" }],
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error: any) {
    console.error("Create Product Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
