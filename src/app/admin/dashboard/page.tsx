"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ScanLine,
  Receipt,
  RotateCcw,
  Barcode as BarcodeIcon,
  Shirt,
  Plus,
  RefreshCw,
  IndianRupee,
  ShoppingBag,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";

interface DashboardStats {
  period: string;
  metrics: {
    netSales: number;
    grossRevenue: number;
    totalRefunds: number;
    totalBills: number;
    netPiecesSold: number;
    moneyCollected: number;
    averageBillValue: number;
    estimatedGrossMargin: number;
    outstandingDues: number;
  };
  stock: {
    totalUnits: number;
    variantsCount: number;
    outOfStockCount: number;
    lowStockCount: number;
    investedCost: number;
    needingAttention: {
      id: string;
      productName: string;
      size: string;
      color: string;
      sku: string;
      stock: number;
    }[];
  };
  trends: {
    daily: {
      dateStr: string;
      label: string;
      amount: number;
      bills: number;
    }[];
    totalInTrend: number;
  };
  payments: {
    method: string;
    amount: number;
    percentage: number;
  }[];
  topSellers: {
    name: string;
    units: number;
    revenue: number;
  }[];
  recentBills: {
    id: string;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    paymentMethod: string;
    isDue: boolean;
    dueAmount: number;
    createdAt: string;
  }[];
  cashCounter: {
    cashInvoices: number;
    cashRefunds: number;
    cashExpenses: number;
    expectedCashMovement: number;
  };
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<string>("today");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async (selectedPeriod: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/dashboard/stats?period=${selectedPeriod}`);
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(period);
  }, [period]);

  const periods = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "7d", label: "7 days" },
    { key: "30d", label: "30 days" },
    { key: "month", label: "This month" },
    { key: "all", label: "All time" },
  ];

  const maxTrend = stats?.trends?.daily
    ? Math.max(1, ...stats.trends.daily.map((d) => d.amount))
    : 1;

  const maxTopSeller = stats?.topSellers
    ? Math.max(1, ...stats.topSellers.map((s) => s.revenue))
    : 1;

  return (
    <div className="w-full space-y-4 sm:space-y-5 font-sans">
      {/* 1. Welcome & Quick Action Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-1">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Store Intelligence & Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Store Overview 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Understand today&apos;s business, spot inventory shortages, and streamline daily counter operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <Link
            href="/admin/pos"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-100 transition"
          >
            <ScanLine className="w-4 h-4 shrink-0" />
            <span>+ New Bill</span>
          </Link>
          <Link
            href="/admin/returns"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-semibold transition"
          >
            <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Returns & Exchanges</span>
          </Link>
          <Link
            href="/admin/barcodes"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition"
          >
            <BarcodeIcon className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Barcode Labels</span>
          </Link>
          <Link
            href="/admin/products"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition"
          >
            <Shirt className="w-4 h-4 shrink-0 text-slate-500" />
            <span>Products</span>
          </Link>
        </div>
      </div>

      {/* 2. Performance Window Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Performance Window</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Changes all sales revenue, bill counts, and margin figures below.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {periods.map((p) => {
            const isActive = period === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs shadow-indigo-100"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Primary Sales KPI Metrics (6 Cards in Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-3.5">
        {/* KPI 1: Net Sales */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Net Sales
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">
              ₹{Number(stats?.metrics?.netSales || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-2">
            After recorded refunds
          </p>
        </div>

        {/* KPI 2: Bills */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Bills
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">
              {stats?.metrics?.totalBills || 0}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-2">
            {stats?.metrics?.netPiecesSold || 0} net pieces sold
          </p>
        </div>

        {/* KPI 3: Money Collected */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Money Collected
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">
              ₹{Number(stats?.metrics?.moneyCollected || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-2">
            Based on invoice payments
          </p>
        </div>

        {/* KPI 4: Average Bill Value */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Avg Bill Value
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">
              ₹{Number(stats?.metrics?.averageBillValue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-2">
            Net sales ÷ bills
          </p>
        </div>

        {/* KPI 5: Estimated Gross Margin */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Gross Margin
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">
              ₹{Number(stats?.metrics?.estimatedGrossMargin || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-2">
            Before operating expenses
          </p>
        </div>

        {/* KPI 6: Customer Dues */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Customer Dues
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">
              ₹{Number(stats?.metrics?.outstandingDues || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-2">
            All-time unpaid balances
          </p>
        </div>
      </div>

      {/* 4. Visual Charts Grid (Sales Trend + Payments Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Sales Trend (7 or 8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Sales Trend</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Net bill value per day · latest {stats?.trends?.daily?.length || 7} days
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              Full Invoices &rarr;
            </Link>
          </div>

          {/* Bar Chart Container */}
          <div className="h-44 sm:h-52 flex items-end gap-2 sm:gap-3 pt-6 pb-2 px-1">
            {stats?.trends?.daily && stats.trends.daily.length > 0 ? (
              stats.trends.daily.map((d, i) => {
                const heightPct = maxTrend > 0 ? Math.max(8, (d.amount / maxTrend) * 100) : 8;
                return (
                  <div
                    key={d.dateStr || i}
                    className="flex-1 flex flex-col items-center justify-end h-full gap-2 group relative"
                  >
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded shadow-lg whitespace-nowrap pointer-events-none z-10">
                      {d.label}: ₹{d.amount.toFixed(2)} ({d.bills} bills)
                    </div>

                    {/* Bar Track & Fill */}
                    <div className="w-full h-full flex flex-col justify-end bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                      <div
                        style={{ height: `${d.amount > 0 ? heightPct : 0}%` }}
                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md transition-all duration-300 group-hover:brightness-110"
                      ></div>
                    </div>

                    {/* Day Label */}
                    <span className="text-[10px] font-semibold text-slate-400 truncate max-w-full text-center">
                      {d.label}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                No trend data available for this range
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-medium">Period Total in Window</span>
            <span className="text-sm font-extrabold text-slate-900">
              ₹{Number(stats?.trends?.totalInTrend || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Right: Where Payments Came From (4 or 5 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>Where Payments Came From</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Recorded tender breakdown
            </p>
          </div>

          <div className="space-y-4 pt-1">
            {stats?.payments && stats.payments.length > 0 ? (
              stats.payments.map((p) => (
                <div key={p.method} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      {p.method === "CASH" && <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
                      {p.method === "UPI" && <QrCode className="w-3.5 h-3.5 text-indigo-600" />}
                      {p.method === "CARD" && <CreditCard className="w-3.5 h-3.5 text-blue-600" />}
                      {p.method}
                    </span>
                    <span className="font-mono">
                      ₹{p.amount.toFixed(2)} ({p.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(5, p.percentage)}%` }}
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No payment transactions recorded yet.
              </div>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] text-slate-500">
            Recorded via POS Billing tender selection. Real-time reconciliation.
          </div>
        </div>
      </div>

      {/* 5. Inventory Stock Health (4 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Available stock */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Available Stock
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">
              {stats?.stock?.totalUnits || 0} <span className="text-xs font-normal text-slate-400">pcs</span>
            </p>
          </div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold mt-2"
          >
            <span>{stats?.stock?.variantsCount || 0} active/inactive variants</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Out of Stock */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Out of Stock
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">
              {stats?.stock?.outOfStockCount || 0}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-2">
            Variants cannot be sold
          </p>
        </div>

        {/* Low Stock */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Low Stock
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">
              {stats?.stock?.lowStockCount || 0}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-2">
            At or below reorder threshold
          </p>
        </div>

        {/* Stock invested (cost) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Stock Invested (Cost)
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">
              ₹{Number(stats?.stock?.investedCost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-2">
            Current quantity × recorded cost
          </p>
        </div>
      </div>

      {/* 6. Actionable Two Columns: Stock Needing Attention & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Stock Needing Attention */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Stock Needing Attention</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Out of stock first · then low stock
              </p>
            </div>
            <Link
              href="/admin/products"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              Restock &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-2.5">Product / Size / Color</th>
                  <th className="px-3.5 py-2.5 text-center">Left</th>
                  <th className="px-3.5 py-2.5 text-right">Next Step</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {stats?.stock?.needingAttention && stats.stock.needingAttention.length > 0 ? (
                  stats.stock.needingAttention.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-2.5">
                        <span className="font-semibold text-slate-900 block truncate max-w-[200px]">
                          {item.productName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.size} / {item.color}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.stock === 0
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {item.stock} pcs
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                        <Link
                          href="/admin/products"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition"
                        >
                          <span>Adjust</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-400 text-xs">
                      All inventory stock levels are healthy!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Top Selling Products */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Top Selling Products</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Revenue before bill-level discounts
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              See Ranking &rarr;
            </Link>
          </div>

          <div className="space-y-3.5 pt-1">
            {stats?.topSellers && stats.topSellers.length > 0 ? (
              stats.topSellers.map((prod, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-900 truncate max-w-[220px]">
                      {idx + 1}. {prod.name}
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      ₹{prod.revenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(8, (prod.revenue / maxTopSeller) * 100)}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        idx === 0 ? "bg-indigo-600" : "bg-indigo-400"
                      }`}
                    ></div>
                  </div>
                  <div className="text-[10px] text-slate-400 text-right">
                    {prod.units} pieces sold
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Your best sellers will appear here as you create bills.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7. Bottom Section: Recent Bills & Today's Cash Counter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Recent Bills Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <span>Recent Bills</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Latest transactions at checkout
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              All Invoices &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-2.5">Invoice</th>
                  <th className="px-3.5 py-2.5">Customer</th>
                  <th className="px-3.5 py-2.5 text-right">Amount</th>
                  <th className="px-3.5 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {stats?.recentBills && stats.recentBills.length > 0 ? (
                  stats.recentBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-2.5 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        {bill.orderNumber}
                      </td>
                      <td className="px-3.5 py-2.5 font-medium text-slate-800 whitespace-nowrap">
                        {bill.customerName}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-slate-900 whitespace-nowrap">
                        ₹{bill.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            bill.isDue
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {bill.isDue ? `Due ₹${bill.dueAmount.toFixed(2)}` : "Paid"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-xs">
                      No bills recorded yet. Launch POS Billing to start selling!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Today's Cash Counter */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Today&apos;s Cash Counter</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Physical drawer balance & reconciliation
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              Live Counter
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Cash Invoices:</span>
              <strong className="text-slate-900">
                ₹{Number(stats?.cashCounter?.cashInvoices || 0).toFixed(2)}
              </strong>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>Cash Refunds:</span>
              <strong className="text-rose-600">
                − ₹{Number(stats?.cashCounter?.cashRefunds || 0).toFixed(2)}
              </strong>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>Cash Expenses:</span>
              <strong className="text-rose-600">
                − ₹{Number(stats?.cashCounter?.cashExpenses || 0).toFixed(2)}
              </strong>
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm font-extrabold text-slate-900">
              <span>Expected Cash Movement:</span>
              <span className="text-emerald-700">
                ₹{Number(stats?.cashCounter?.expectedCashMovement || 0).toFixed(2)}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
              Opening drawer float and miscellaneous cash adjustments are verified during day closing.
            </p>
          </div>

          {/* Quick Shortcuts */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </Link>
            <Link
              href="/admin/barcodes"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              <BarcodeIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Barcode Labels</span>
            </Link>
            <Link
              href="/admin/returns"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Process Return</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
