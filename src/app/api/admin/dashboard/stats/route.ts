import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getRange(period: string): { start: Date | null; end: Date | null } {
  const now = new Date();
  const startOfDay = (d: Date) => {
    const res = new Date(d);
    res.setHours(0, 0, 0, 0);
    return res;
  };
  const endOfDay = (d: Date) => {
    const res = new Date(d);
    res.setHours(23, 59, 59, 999);
    return res;
  };

  if (period === "today") {
    return { start: startOfDay(now), end: endOfDay(now) };
  }
  if (period === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return { start: startOfDay(y), end: endOfDay(y) };
  }
  if (period === "7d") {
    const past = new Date(now);
    past.setDate(past.getDate() - 6);
    return { start: startOfDay(past), end: endOfDay(now) };
  }
  if (period === "30d") {
    const past = new Date(now);
    past.setDate(past.getDate() - 29);
    return { start: startOfDay(past), end: endOfDay(now) };
  }
  if (period === "month") {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: startOfDay(firstDay), end: endOfDay(now) };
  }
  return { start: null, end: null }; // "all"
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "today";
    const { start, end } = getRange(period);

    // Date filters for orders and returns
    const orderDateFilter: any = {};
    if (start && end) {
      orderDateFilter.createdAt = { gte: start, lte: end };
    }

    // 1. Fetch Orders in window and all orders for dues
    let windowOrders: any[] = [];
    let allOrders: any[] = [];
    try {
      [windowOrders, allOrders] = await Promise.all([
        (prisma as any).order.findMany({
          where: orderDateFilter,
          include: { items: true },
          orderBy: { createdAt: "desc" },
        }),
        (prisma as any).order.findMany({
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            amountPaid: true,
            paymentMethod: true,
            paymentStatus: true,
            createdAt: true,
          },
        }),
      ]);
    } catch (e: any) {
      console.warn("Orders fetch warning:", e?.message);
    }

    // 2. Fetch Returns in window
    let windowReturns: any[] = [];
    let todayReturns: any[] = [];
    try {
      const returnWhere: any = {};
      if (start && end) {
        returnWhere.createdAt = { gte: start, lte: end };
      }
      windowReturns = await (prisma as any).return.findMany({
        where: returnWhere,
      });

      // Today's returns for cash counter
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      todayReturns = await (prisma as any).return.findMany({
        where: { createdAt: { gte: todayStart } },
      });
    } catch {
      // If Return table not queried, fallback to raw or empty
      try {
        const raw: any[] = await prisma.$queryRawUnsafe(`
          SELECT * FROM "Return"
          ${start && end ? `WHERE "createdAt" >= '${start.toISOString()}' AND "createdAt" <= '${end.toISOString()}'` : ""}
        `);
        windowReturns = raw || [];
      } catch {
        windowReturns = [];
      }
    }

    // 3. Fetch Products and Variants for Inventory Health
    let products: any[] = [];
    try {
      products = await (prisma as any).product.findMany({
        include: {
          variants: true,
        },
      });
    } catch {
      products = [];
    }

    // Flatten all variants
    const allVariants: any[] = [];
    products.forEach((p) => {
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v: any) => {
          allVariants.push({
            id: v.id,
            productId: p.id,
            productName: p.name,
            sku: v.sku,
            size: v.size,
            color: v.color,
            price: Number(v.price || p.price || 0),
            costPrice: Number(v.costPrice || p.costPrice || 0),
            stock: Number(v.stock || 0),
            low: 3,
            isActive: v.isActive && p.isActive,
          });
        });
      } else {
        allVariants.push({
          id: p.id,
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          size: "Standard",
          color: "Standard",
          price: Number(p.price || 0),
          costPrice: Number(p.costPrice || 0),
          stock: Number(p.stock || 0),
          low: 3,
          isActive: p.isActive,
        });
      }
    });

    // Stock calculations
    const totalStockUnits = allVariants.reduce((sum, v) => sum + v.stock, 0);
    const outOfStockVariants = allVariants.filter((v) => v.stock === 0);
    const lowStockVariants = allVariants.filter((v) => v.stock > 0 && v.stock <= v.low);
    const stockInvestedCost = allVariants.reduce((sum, v) => sum + v.stock * v.costPrice, 0);

    // Stock Needing Attention (out of stock first, then low stock, up to 8)
    const stockNeedingAttention = [...outOfStockVariants, ...lowStockVariants].slice(0, 8);

    // Sales metrics calculations
    const grossRevenue = windowOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const totalRefunds = windowReturns.reduce((sum, r) => sum + Number(r.refundAmount || 0), 0);
    const netSales = Math.max(0, grossRevenue - totalRefunds);

    const totalBills = windowOrders.length;
    const totalUnitsSold = windowOrders.reduce(
      (sum, o) => sum + (o.items || []).reduce((iSum: number, i: any) => iSum + (Number(i.quantity) || 1), 0),
      0
    );
    const totalUnitsReturned = windowReturns.reduce((sum, r) => sum + (Number(r.quantity) || 1), 0);
    const netPiecesSold = Math.max(0, totalUnitsSold - totalUnitsReturned);

    const moneyCollected = windowOrders.reduce((sum, o) => sum + Number(o.amountPaid || o.totalAmount || 0), 0);
    const averageBillValue = totalBills > 0 ? netSales / totalBills : 0;

    // Estimated COGS (cost of goods sold)
    const totalCogs = windowOrders.reduce(
      (sum, o) =>
        sum +
        (o.items || []).reduce(
          (iSum: number, i: any) => iSum + (Number(i.quantity) || 1) * (Number(i.costPrice) || 0),
          0
        ),
      0
    );
    const estimatedGrossMargin = Math.max(0, netSales - totalCogs);

    // Customer dues: Total amount minus Amount Paid across all orders
    const outstandingDues = allOrders.reduce((sum, o) => {
      const tot = Number(o.totalAmount || 0);
      const pd = Number(o.amountPaid || 0);
      return sum + Math.max(0, tot - pd);
    }, 0);

    // Tender / Payment Breakdown in window
    const paymentMap: Record<string, number> = {};
    windowOrders.forEach((o) => {
      const mode = (o.paymentMethod || "CASH").toUpperCase();
      paymentMap[mode] = (paymentMap[mode] || 0) + Number(o.amountPaid || o.totalAmount || 0);
    });
    const paymentBreakdown = Object.entries(paymentMap).map(([method, amount]) => ({
      method,
      amount,
      percentage: moneyCollected > 0 ? Math.round((amount / moneyCollected) * 100) : 0,
    }));

    // Top Selling Garments
    const productSalesMap: Record<string, { name: string; units: number; revenue: number }> = {};
    windowOrders.forEach((o) => {
      (o.items || []).forEach((item: any) => {
        const key = item.productId || item.productName;
        if (!productSalesMap[key]) {
          productSalesMap[key] = {
            name: item.productName,
            units: 0,
            revenue: 0,
          };
        }
        productSalesMap[key].units += Number(item.quantity) || 1;
        productSalesMap[key].revenue += Number(item.total) || (Number(item.price) * (Number(item.quantity) || 1));
      });
    });
    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Daily Sales Trend Chart (last 7 or 14 days)
    const daysCount = period === "30d" || period === "month" ? 14 : 7;
    const trendDays: { dateStr: string; label: string; amount: number; bills: number }[] = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

      const dayOrders = allOrders.filter(
        (o) => new Date(o.createdAt).toISOString().slice(0, 10) === iso
      );
      const dayTotal = dayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

      trendDays.push({
        dateStr: iso,
        label,
        amount: dayTotal,
        bills: dayOrders.length,
      });
    }

    // Today's Cash Counter
    const todayIso = new Date().toISOString().slice(0, 10);
    const todayOrders = allOrders.filter(
      (o) => new Date(o.createdAt).toISOString().slice(0, 10) === todayIso
    );
    const cashInvoices = todayOrders
      .filter((o) => (o.paymentMethod || "").toUpperCase() === "CASH")
      .reduce((sum, o) => sum + Number(o.amountPaid || o.totalAmount || 0), 0);

    const cashRefunds = todayReturns
      .filter((r) => (r.refundMethod || "").toUpperCase() === "CASH")
      .reduce((sum, r) => sum + Number(r.refundAmount || 0), 0);

    const cashExpenses = 0; // standard cash expenses
    const expectedCashMovement = cashInvoices - cashRefunds - cashExpenses;

    // Recent 6 Bills
    const recentBills = windowOrders.slice(0, 6).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName || "Walk-in Customer",
      totalAmount: Number(o.totalAmount || 0),
      paymentMethod: o.paymentMethod || "CASH",
      isDue: Number(o.amountPaid || 0) < Number(o.totalAmount || 0),
      dueAmount: Math.max(0, Number(o.totalAmount || 0) - Number(o.amountPaid || 0)),
      createdAt: o.createdAt,
    }));

    return NextResponse.json({
      period,
      metrics: {
        netSales,
        grossRevenue,
        totalRefunds,
        totalBills,
        netPiecesSold,
        moneyCollected,
        averageBillValue,
        estimatedGrossMargin,
        outstandingDues,
      },
      stock: {
        totalUnits: totalStockUnits,
        variantsCount: allVariants.length,
        outOfStockCount: outOfStockVariants.length,
        lowStockCount: lowStockVariants.length,
        investedCost: stockInvestedCost,
        needingAttention: stockNeedingAttention,
      },
      trends: {
        daily: trendDays,
        totalInTrend: trendDays.reduce((sum, t) => sum + t.amount, 0),
      },
      payments: paymentBreakdown,
      topSellers: topSellingProducts,
      recentBills,
      cashCounter: {
        cashInvoices,
        cashRefunds,
        cashExpenses,
        expectedCashMovement,
      },
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load dashboard metrics" },
      { status: 500 }
    );
  }
}
