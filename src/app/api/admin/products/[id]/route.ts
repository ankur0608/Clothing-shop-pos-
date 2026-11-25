import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!prisma?.product) {
      return NextResponse.json(
        { error: "Product database model is not initialized." },
        { status: 500 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: [{ color: "asc" }, { size: "asc" }],
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("Get Product Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}

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

    if (!prisma?.product) {
      return NextResponse.json(
        { error: "Product database model is not initialized." },
        { status: 500 }
      );
    }

    const data: any = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.sku !== undefined) data.sku = body.sku.trim().toUpperCase();
    if (body.barcode !== undefined) data.barcode = body.barcode?.trim() || null;
    if (body.category !== undefined) data.category = body.category.trim();
    if (body.price !== undefined) data.price = Number(body.price);
    if (body.costPrice !== undefined) data.costPrice = Number(body.costPrice);
    if (body.size !== undefined) {
      data.size = Array.isArray(body.size)
        ? body.size.join(", ")
        : typeof body.size === "string"
        ? body.size.trim()
        : null;
    }
    if (body.color !== undefined) {
      data.color = Array.isArray(body.color)
        ? body.color.join(", ")
        : typeof body.color === "string"
        ? body.color.trim()
        : null;
    }
    if (body.stock !== undefined) data.stock = parseInt(body.stock, 10);
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    const hasVariants = Array.isArray(body.variants);

    if (hasVariants) {
      const variants = body.variants;
      const cleanSku = data.sku || "PROD";

      const distinctSizes = Array.from(new Set(variants.map((v: any) => v.size?.trim()).filter(Boolean)));
      const distinctColors = Array.from(new Set(variants.map((v: any) => v.color?.trim()).filter(Boolean)));
      if (distinctSizes.length > 0) data.size = distinctSizes.join(", ");
      if (distinctColors.length > 0) data.color = distinctColors.join(", ");

      data.stock = variants.reduce((sum: number, v: any) => sum + (parseInt(v.stock, 10) || 0), 0);
      const prices = variants.map((v: any) => Number(v.price)).filter((p: number) => !isNaN(p) && p > 0);
      if (prices.length > 0) {
        data.price = Math.min(...prices);
      }

      const variantCreateData = variants.map((v: any, index: number) => {
        const vSize = v.size?.trim() || "M";
        const vColor = v.color?.trim() || "Standard";
        const vSku = v.sku?.trim().toUpperCase() || `${cleanSku}-${vColor.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase()}-${vSize}-${index + 1}`;
        return {
          productId: id,
          sku: vSku,
          barcode: v.barcode?.trim() || null,
          size: vSize,
          color: vColor,
          price: Number(v.price) || Number(data.price) || 0,
          costPrice: Number(v.costPrice) || Number(data.costPrice) || 0,
          stock: parseInt(v.stock, 10) || 0,
          isActive: v.isActive !== undefined ? Boolean(v.isActive) : true,
        };
      });

      // Atomic replace of variants and update of product
      await prisma.$transaction(async (tx) => {
        await tx.productVariant.deleteMany({
          where: { productId: id },
        });

        if (variantCreateData.length > 0) {
          await tx.productVariant.createMany({
            data: variantCreateData,
          });
        }

        await tx.product.update({
          where: { id },
          data,
        });
      });
    } else {
      await prisma.product.update({
        where: { id },
        data,
      });
    }

    const updated = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: [{ color: "asc" }, { size: "asc" }],
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product: updated,
    });
  } catch (error: any) {
    console.error("Update Product Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update product" },
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
    if (!prisma?.product) {
      return NextResponse.json(
        { error: "Product database model is not initialized." },
        { status: 500 }
      );
    }
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete Product Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
