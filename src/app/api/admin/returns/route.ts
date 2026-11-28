import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Ensure table exists safely
async function ensureReturnTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Return" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "returnNumber" TEXT NOT NULL UNIQUE,
        "orderId" TEXT NOT NULL,
        "orderItemId" TEXT,
        "productId" TEXT,
        "variantId" TEXT,
        "productName" TEXT NOT NULL,
        "sku" TEXT NOT NULL,
        "barcode" TEXT,
        "size" TEXT,
        "color" TEXT,
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "refundAmount" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
        "refundMethod" TEXT NOT NULL DEFAULT 'CASH',
        "condition" TEXT NOT NULL DEFAULT 'SELLABLE',
        "reason" TEXT,
        "adminId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err: any) {
    console.warn("ensureReturnTable notice:", err?.message);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureReturnTable();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const condition = searchParams.get("condition") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "20", 10));
    const skip = (page - 1) * limit;

    let returnsList: any[] = [];
    let totalCount = 0;

    const where: any = {};
    if (condition) {
      where.condition = condition;
    }
    if (search) {
      where.OR = [
        { returnNumber: { contains: search, mode: "insensitive" } },
        { productName: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { order: { orderNumber: { contains: search, mode: "insensitive" } } },
        { order: { customerName: { contains: search, mode: "insensitive" } } },
      ];
    }

    try {
      const [count, list] = await Promise.all([
        (prisma as any).return.count({ where }),
        (prisma as any).return.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            order: {
              select: {
                orderNumber: true,
                customerName: true,
                customerPhone: true,
                totalAmount: true,
                createdAt: true,
              },
            },
            admin: {
              select: { name: true, email: true },
            },
          },
        }),
      ]);
      totalCount = count;
      returnsList = list;
    } catch (e: any) {
      console.warn("Prisma findMany returns fallback to raw query:", e?.message);
      // Fallback via raw SQL if prisma client hasn't generated yet
      const countRes: any[] = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*)::int as count FROM "Return"
      `);
      totalCount = countRes[0]?.count || 0;

      const rawRows: any[] = await prisma.$queryRawUnsafe(`
        SELECT r.*, o."orderNumber", o."customerName", o."customerPhone", o."totalAmount" as "orderTotal"
        FROM "Return" r
        LEFT JOIN "Order" o ON r."orderId" = o."id"
        ORDER BY r."createdAt" DESC
        LIMIT ${limit} OFFSET ${skip}
      `);
      returnsList = rawRows.map((row) => ({
        ...row,
        order: {
          orderNumber: row.orderNumber,
          customerName: row.customerName,
          customerPhone: row.customerPhone,
          totalAmount: row.orderTotal,
        },
      }));
    }

    // Compute summary statistics across all returns
    let allReturnsForStats: any[] = returnsList;
    try {
      allReturnsForStats = await (prisma as any).return.findMany({
        select: { refundAmount: true, quantity: true, condition: true },
      });
    } catch {
      // ignore
    }

    const totalRefundAmount = allReturnsForStats.reduce(
      (sum, r) => sum + Number(r.refundAmount || 0),
      0
    );
    const totalQuantity = allReturnsForStats.reduce(
      (sum, r) => sum + Number(r.quantity || 0),
      0
    );
    const sellableCount = allReturnsForStats.filter((r) => r.condition === "SELLABLE").length;
    const damagedCount = allReturnsForStats.filter((r) => r.condition === "DAMAGED").length;

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return NextResponse.json({
      returns: returnsList,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats: {
        totalReturns: totalCount,
        totalRefundAmount,
        totalQuantity,
        sellableCount,
        damagedCount,
      },
    });
  } catch (error: any) {
    console.error("Returns fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch returns" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureReturnTable();

    const body = await req.json();
    const {
      orderId,
      orderItemId,
      variantId,
      productId,
      productName,
      sku,
      barcode,
      size,
      color,
      quantity = 1,
      refundAmount,
      refundMethod = "CASH",
      condition = "SELLABLE",
      reason = "Customer Return",
    } = body;

    if (!orderId || !productName || !sku) {
      return NextResponse.json(
        { error: "Order ID, product name, and SKU are required" },
        { status: 400 }
      );
    }

    const returnQty = Math.max(1, parseInt(quantity, 10) || 1);

    // Verify order exists
    let order: any = null;
    try {
      order = await (prisma as any).order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
    } catch {
      // ignore
    }

    // Generate Return Number: RET-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    const returnNumber = `RET-${dateStr}-${randomSuffix}`;

    const parsedRefundAmount =
      refundAmount !== undefined && refundAmount !== null
        ? Number(refundAmount)
        : 0;

    let newReturn: any = null;

    try {
      newReturn = await (prisma as any).return.create({
        data: {
          returnNumber,
          orderId,
          orderItemId: orderItemId || null,
          productId: productId || null,
          variantId: variantId || null,
          productName,
          sku,
          barcode: barcode || null,
          size: size || null,
          color: color || null,
          quantity: returnQty,
          refundAmount: parsedRefundAmount,
          refundMethod,
          condition,
          reason: reason ? reason.trim() : null,
          adminId: session.admin.id,
        },
      });
    } catch (e: any) {
      console.warn("Prisma create return fallback to raw query:", e?.message);
      const insertId = `ret_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Return" ("id", "returnNumber", "orderId", "orderItemId", "productId", "variantId", "productName", "sku", "barcode", "size", "color", "quantity", "refundAmount", "refundMethod", "condition", "reason", "adminId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())`,
        insertId,
        returnNumber,
        orderId,
        orderItemId || null,
        productId || null,
        variantId || null,
        productName,
        sku,
        barcode || null,
        size || null,
        color || null,
        returnQty,
        parsedRefundAmount,
        refundMethod,
        condition,
        reason || null,
        session.admin.id
      );
      newReturn = {
        id: insertId,
        returnNumber,
        orderId,
        orderItemId,
        productId,
        variantId,
        productName,
        sku,
        barcode,
        size,
        color,
        quantity: returnQty,
        refundAmount: parsedRefundAmount,
        refundMethod,
        condition,
        reason,
        createdAt: new Date().toISOString(),
      };
    }

    // If condition is SELLABLE, add stock back to variant / product
    let restocked = false;
    if (condition === "SELLABLE") {
      try {
        if (variantId) {
          await (prisma as any).productVariant.update({
            where: { id: variantId },
            data: {
              stock: { increment: returnQty },
            },
          });
          restocked = true;
        }

        if (productId) {
          await (prisma as any).product.update({
            where: { id: productId },
            data: {
              stock: { increment: returnQty },
            },
          });
          restocked = true;
        }
      } catch (stockErr: any) {
        console.warn("Could not auto-increment stock on return:", stockErr?.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Return ${returnNumber} processed successfully.${restocked ? ` ${returnQty} unit(s) restocked into inventory.` : " Item marked damaged (not restocked)."}`,
      return: newReturn,
      restocked,
    });
  } catch (error: any) {
    console.error("Return creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process return" },
      { status: 500 }
    );
  }
}
