"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  RotateCcw,
  Search,
  Receipt,
  Printer,
  Calendar,
  IndianRupee,
  Package,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  RefreshCw,
  ShoppingBag,
  ScanLine,
  X,
  Sparkles,
  CreditCard,
  QrCode,
  Banknote,
  Layers,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface OrderItem {
  id: string;
  productId?: string;
  variantId?: string;
  productName: string;
  sku: string;
  barcode?: string;
  size?: string;
  color?: string;
  price: number;
  costPrice?: number;
  quantity: number;
  total: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  totalAmount: number;
  amountPaid: number;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
}

interface ReturnRecord {
  id: string;
  returnNumber: string;
  orderId: string;
  orderItemId?: string;
  productId?: string;
  variantId?: string;
  productName: string;
  sku: string;
  barcode?: string;
  size?: string;
  color?: string;
  quantity: number;
  refundAmount: number;
  refundMethod: string;
  condition: string;
  reason?: string;
  createdAt: string;
  order?: {
    orderNumber: string;
    customerName: string;
    customerPhone?: string;
    totalAmount: number;
    createdAt: string;
  };
}

export default function ReturnsExchangesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [returnsList, setReturnsList] = useState<ReturnRecord[]>([]);
  const [stats, setStats] = useState({
    totalReturns: 0,
    totalRefundAmount: 0,
    totalQuantity: 0,
    sellableCount: 0,
    damagedCount: 0,
  });
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingReturns, setLoadingReturns] = useState(false);

  // Active view: "new" (process return) or "history" (returns history)
  const [activeTab, setActiveTab] = useState<"process" | "history">("process");

  // Invoice Search & Selection
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Return Modal State
  const [modalItem, setModalItem] = useState<OrderItem | null>(null);
  const [returnQty, setReturnQty] = useState(1);
  const [returnCondition, setReturnCondition] = useState<"SELLABLE" | "DAMAGED">("SELLABLE");
  const [refundMethod, setRefundMethod] = useState("CASH");
  const [returnReason, setReturnReason] = useState("Size / Fit issue");
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Print Slip Modal State
  const [slipReturn, setSlipReturn] = useState<ReturnRecord | null>(null);

  // Filter for history
  const [historySearch, setHistorySearch] = useState("");
  const [historyCondition, setHistoryCondition] = useState("");
  const [returnPage, setReturnPage] = useState(1);
  const [returnPagination, setReturnPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await fetch("/api/admin/orders?limit=100");
      const data = await res.json();
      if (res.ok && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch returns
  const fetchReturns = async (targetPage = returnPage) => {
    try {
      setLoadingReturns(true);
      const params = new URLSearchParams();
      if (historySearch) params.set("search", historySearch);
      if (historyCondition) params.set("condition", historyCondition);
      params.set("page", String(targetPage));
      params.set("limit", "20");
      const res = await fetch(`/api/admin/returns?${params.toString()}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.returns)) {
        setReturnsList(data.returns);
        if (data.stats) {
          setStats(data.stats);
        }
        if (data.pagination) {
          setReturnPagination(data.pagination);
        }
      }
    } catch (err) {
      console.error("Failed to fetch returns:", err);
    } finally {
      setLoadingReturns(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchReturns(1);
  }, []);

  useEffect(() => {
    setReturnPage(1);
    fetchReturns(1);
  }, [historyCondition]);

  const handleReturnPageChange = (newPage: number) => {
    setReturnPage(newPage);
    fetchReturns(newPage);
  };

  // Compute returned quantity per item
  const getReturnedQtyForItem = (orderId: string, orderItemId?: string, sku?: string) => {
    return returnsList
      .filter((r) => r.orderId === orderId && (r.orderItemId === orderItemId || r.sku === sku))
      .reduce((sum, r) => sum + Number(r.quantity || 0), 0);
  };

  // Filtered orders list for invoice selector
  const filteredOrders = orders.filter((o) => {
    const q = invoiceSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      o.orderNumber?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      (o.customerPhone && o.customerPhone.includes(q))
    );
  });

  // Open modal to process return for specific item
  const handleOpenReturnModal = (item: OrderItem) => {
    if (!selectedOrder) return;
    const returnedAlready = getReturnedQtyForItem(selectedOrder.id, item.id, item.sku);
    const maxAllowed = Math.max(0, item.quantity - returnedAlready);
    if (maxAllowed <= 0) return;

    setModalItem(item);
    setReturnQty(1);
    setReturnCondition("SELLABLE");
    setRefundMethod(selectedOrder.paymentMethod || "CASH");
    setReturnReason("Size / Fit issue");
    setCustomReason("");
  };

  // Calculate refund amount
  const calculateRefundAmount = () => {
    if (!modalItem) return 0;
    const unitPrice = modalItem.quantity > 0 ? Number(modalItem.total) / modalItem.quantity : Number(modalItem.price);
    return Math.round(unitPrice * returnQty * 100) / 100;
  };

  // Submit return
  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !modalItem) return;

    try {
      setSubmitting(true);
      const finalRefund = calculateRefundAmount();
      const finalReason = customReason.trim() ? `${returnReason}: ${customReason.trim()}` : returnReason;

      const payload = {
        orderId: selectedOrder.id,
        orderItemId: modalItem.id,
        productId: modalItem.productId,
        variantId: modalItem.variantId,
        productName: modalItem.productName,
        sku: modalItem.sku,
        barcode: modalItem.barcode,
        size: modalItem.size,
        color: modalItem.color,
        quantity: returnQty,
        refundAmount: finalRefund,
        refundMethod,
        condition: returnCondition,
        reason: finalReason,
      };

      const res = await fetch("/api/admin/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to process return");
        return;
      }

      // Close modal
      setModalItem(null);
      // Refresh returns list & orders
      await fetchReturns();
      // Show confirmation slip
      if (data.return) {
        setSlipReturn({
          ...data.return,
          order: {
            orderNumber: selectedOrder.orderNumber,
            customerName: selectedOrder.customerName,
            customerPhone: selectedOrder.customerPhone,
            totalAmount: selectedOrder.totalAmount,
            createdAt: selectedOrder.createdAt,
          },
        });
      }
    } catch (err: any) {
      console.error("Submit return error:", err);
      alert(err.message || "Failed to submit return");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-4 sm:space-y-5 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-1">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Returns & Exchanges Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Returns & Exchanges
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Process sold item returns, issue instant refunds, restock sellable variants, or handle replacements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              fetchOrders();
              fetchReturns();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-xs transition"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span>Refresh</span>
          </button>
          <Link
            href="/admin/pos"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-100 transition"
          >
            <ScanLine className="w-4 h-4" />
            <span>POS Billing</span>
          </Link>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition"
          >
            <Receipt className="w-4 h-4 text-indigo-600" />
            <span>Sales History</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Returns */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Returns
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalReturns}</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Processed return records</p>
          </div>
        </div>

        {/* KPI 2: Total Refund Amount */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Refunded
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              ₹{Number(stats.totalRefundAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Issued customer refunds</p>
          </div>
        </div>

        {/* KPI 3: Units Returned */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Units Returned
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.totalQuantity} <span className="text-xs text-slate-400 font-normal">pcs</span>
            </p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Pieces returned by shoppers</p>
          </div>
        </div>

        {/* KPI 4: Restocked vs Damaged */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Inventory Impact
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                Sellable (Restocked):
              </span>
              <span className="font-bold text-slate-900">{stats.sellableCount}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-rose-700 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                Damaged (Written off):
              </span>
              <span className="font-bold text-slate-900">{stats.damagedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("process")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === "process"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-100"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Process Return / Exchange</span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === "history"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-100"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Returns History ({returnsList.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PROCESS NEW RETURN                                */}
      {/* ========================================================= */}
      {activeTab === "process" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Select Invoice & Items (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Find Invoice Box */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Search className="w-4 h-4 text-indigo-600" />
                    <span>Step 1: Select Original Invoice</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Search by Bill / Invoice number (e.g. INV-...), customer name, or phone number.
                  </p>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search invoice number, customer name, or phone..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>

              {/* Invoices Dropdown / Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Available Invoices ({filteredOrders.length})
                </label>
                <select
                  value={selectedOrder?.id || ""}
                  onChange={(e) => {
                    const match = orders.find((o) => o.id === e.target.value);
                    setSelectedOrder(match || null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer transition"
                >
                  <option value="">-- Choose an invoice to inspect items --</option>
                  {filteredOrders.slice(0, 50).map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      {ord.orderNumber} • {ord.customerName} • ₹
                      {Number(ord.totalAmount).toFixed(2)} •{" "}
                      {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Invoice Details Pill */}
              {selectedOrder && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-indigo-700">
                        {selectedOrder.orderNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {selectedOrder.paymentMethod}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Customer: <strong>{selectedOrder.customerName}</strong>
                      {selectedOrder.customerPhone && ` • Phone: ${selectedOrder.customerPhone}`}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Billed on:{" "}
                      {new Date(selectedOrder.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 uppercase font-bold block">
                      Total Invoice Value
                    </span>
                    <span className="text-lg font-black text-slate-900">
                      ₹{Number(selectedOrder.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Items in Selected Invoice */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-600" />
                  <span>Step 2: Choose Item to Return or Exchange</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click &quot;Return Item&quot; next to any variant to specify return quantity, condition, and refund method.
                </p>
              </div>

              {!selectedOrder ? (
                <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded-xl text-slate-400">
                  <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No invoice selected</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Select an invoice above to view billed garments and size/color details.
                  </p>
                </div>
              ) : selectedOrder.items.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No line items found in this order.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] sm:text-[11px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Garment Item</th>
                        <th className="px-4 py-3">Variant</th>
                        <th className="px-4 py-3 text-center">Billed Qty</th>
                        <th className="px-4 py-3 text-center">Returned</th>
                        <th className="px-4 py-3 text-center">Remaining</th>
                        <th className="px-4 py-3 text-right">Line Total</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedOrder.items.map((item) => {
                        const returnedQty = getReturnedQtyForItem(
                          selectedOrder.id,
                          item.id,
                          item.sku
                        );
                        const remainingQty = Math.max(0, item.quantity - returnedQty);
                        const isFullyReturned = remainingQty <= 0;

                        return (
                          <tr
                            key={item.id || item.sku}
                            className={`transition-colors ${
                              isFullyReturned ? "bg-slate-50/60 opacity-60" : "hover:bg-slate-50/80"
                            }`}
                          >
                            <td className="px-4 py-3">
                              <span className="font-semibold text-slate-900 block truncate max-w-[200px]">
                                {item.productName}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                {item.sku}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {item.size && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700">
                                    {item.size}
                                  </span>
                                )}
                                {item.color && (
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-[10px] font-bold text-indigo-700">
                                    {item.color}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-slate-800">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {returnedQty > 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold">
                                  {returnedQty} pcs
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">0</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center font-extrabold text-slate-900">
                              {remainingQty}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                              ₹{Number(item.total).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              {isFullyReturned ? (
                                <span className="text-[11px] font-bold text-slate-400 italic">
                                  Fully Returned
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleOpenReturnModal(item)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Return</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Return Guidelines & Quick Exchange Card (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* How returns work */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Return & Exchange Protocol</span>
              </h3>
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <p>
                    <strong>Search bill:</strong> Retrieve original bill using invoice number or customer mobile.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <p>
                    <strong>Select pieces:</strong> Choose variant and quantity up to unreturned count.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <p>
                    <strong>Condition check:</strong> Mark as <em>Sellable</em> to restock directly into POS, or <em>Damaged</em> to write off.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    4
                  </span>
                  <p>
                    <strong>Refund method:</strong> Settle via Cash, UPI, Card, or Store Credit.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Exchange Banner */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                <span>Exchanges Flow</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                For a direct size or color swap:
                <br />
                <strong>1.</strong> Process the return of the customer&apos;s existing piece here.
                <br />
                <strong>2.</strong> Launch <strong>POS Billing</strong> and scan/select the replacement variant.
                <br />
                <strong>3.</strong> Adjust difference if price differs, or record zero due.
              </p>
              <Link
                href="/admin/pos"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition"
              >
                <ScanLine className="w-4 h-4" />
                <span>Open POS for Replacement</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: RETURN HISTORY REGISTER                           */}
      {/* ========================================================= */}
      {activeTab === "history" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <span>Historical Return Records</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit trail of all processed customer returns and inventory restocking events.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter return #, SKU, or bill..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchReturns()}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              {/* Condition Filter */}
              <select
                value={historyCondition}
                onChange={(e) => setHistoryCondition(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium"
              >
                <option value="">All Conditions</option>
                <option value="SELLABLE">Sellable (Restocked)</option>
                <option value="DAMAGED">Damaged (Written off)</option>
              </select>

              <button
                onClick={() => fetchReturns()}
                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                title="Search returns"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loadingReturns ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
              Loading return records...
            </div>
          ) : returnsList.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-slate-400">
              <RotateCcw className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No return records found</p>
              <p className="text-xs text-slate-400 mt-1">
                Completed returns will be recorded here with complete audit history.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] sm:text-[11px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Return #</th>
                      <th className="px-4 py-3">Original Bill</th>
                      <th className="px-4 py-3">Garment Item</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Refund Amount</th>
                      <th className="px-4 py-3 text-center">Tender</th>
                      <th className="px-4 py-3 text-center">Condition</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Slip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {returnsList.map((ret) => (
                      <tr key={ret.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-rose-700 whitespace-nowrap">
                          {ret.returnNumber}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">
                          {ret.order?.orderNumber || "Original Order"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-900 block truncate max-w-[180px]">
                            {ret.productName}
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                            {ret.size && <span>Size: {ret.size}</span>}
                            {ret.color && <span>• Color: {ret.color}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-900">
                          {ret.quantity}
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                          ₹{Number(ret.refundAmount || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {ret.refundMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              ret.condition === "SELLABLE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {ret.condition === "SELLABLE" ? "Sellable (Restocked)" : "Damaged"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 max-w-[160px] truncate">
                          {ret.reason || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(ret.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSlipReturn(ret)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                            title="Print Return Slip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {returnPagination.totalPages > 1 && (
                <div className="px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 mt-3">
                  <div>
                    Showing{" "}
                    <strong>
                      {Math.min(
                        (returnPagination.page - 1) * returnPagination.limit + 1,
                        returnPagination.totalCount
                      )}
                    </strong>{" "}
                    to{" "}
                    <strong>
                      {Math.min(
                        returnPagination.page * returnPagination.limit,
                        returnPagination.totalCount
                      )}
                    </strong>{" "}
                    of <strong>{returnPagination.totalCount}</strong> return records
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleReturnPageChange(returnPagination.page - 1)}
                      disabled={!returnPagination.hasPrevPage}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    <span className="px-3 py-1 font-bold text-slate-800">
                      Page {returnPagination.page} of {returnPagination.totalPages}
                    </span>

                    <button
                      onClick={() => handleReturnPageChange(returnPagination.page + 1)}
                      disabled={!returnPagination.hasNextPage}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PROCESS RETURN FOR SELECTED ITEM                  */}
      {/* ========================================================= */}
      {modalItem && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Process Item Return
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Original Bill: {selectedOrder.orderNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Item Summary Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
              <span className="text-sm font-bold text-slate-900 block truncate">
                {modalItem.productName}
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="font-mono text-slate-500">SKU: {modalItem.sku}</span>
                {modalItem.size && <span>• Size: <strong>{modalItem.size}</strong></span>}
                {modalItem.color && <span>• Color: <strong>{modalItem.color}</strong></span>}
              </div>
              <div className="text-xs text-slate-500 pt-1">
                Max available for return:{" "}
                <strong className="text-slate-800">
                  {modalItem.quantity - getReturnedQtyForItem(selectedOrder.id, modalItem.id, modalItem.sku)} pcs
                </strong>
              </div>
            </div>

            {/* Return Form */}
            <form onSubmit={handleProcessReturn} className="space-y-4">
              {/* Return Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Return Pieces (Quantity) *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={modalItem.quantity - getReturnedQtyForItem(selectedOrder.id, modalItem.id, modalItem.sku)}
                    value={returnQty}
                    onChange={(e) => setReturnQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-24 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                  <span className="text-xs text-slate-400 font-medium">
                    piece(s) being returned
                  </span>
                </div>
              </div>

              {/* Item Condition (Sellable vs Damaged) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Garment Condition *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReturnCondition("SELLABLE")}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                      returnCondition === "SELLABLE"
                        ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Sellable
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">
                      Restock automatically back to POS inventory
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReturnCondition("DAMAGED")}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                      returnCondition === "DAMAGED"
                        ? "border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      Damaged / Defect
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">
                      Do not restock; write off damaged stock
                    </span>
                  </button>
                </div>
              </div>

              {/* Refund Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Refund Method *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["CASH", "UPI", "CARD", "STORE_CREDIT"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setRefundMethod(mode)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold text-center transition ${
                        refundMethod === mode
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {mode === "STORE_CREDIT" ? "Store Credit" : mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason for Return */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reason for Return
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-medium"
                >
                  <option value="Size / Fit issue">Size / Fit issue</option>
                  <option value="Customer changed mind">Customer changed mind</option>
                  <option value="Fabric / Stitch defect">Fabric / Stitch defect</option>
                  <option value="Color mismatch">Color mismatch</option>
                  <option value="Wrong item billed">Wrong item billed</option>
                  <option value="Exchange request">Exchange request</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="text"
                  placeholder="Optional extra remarks or notes..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Refund Summary Card */}
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
                    Calculated Refund Amount
                  </span>
                  <span className="text-xs text-rose-600">
                    Proportional line refund for {returnQty} unit(s)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-rose-800">
                    ₹{calculateRefundAmount().toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-100 transition disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  <span>Confirm Return & Refund</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PRINTABLE RETURN SLIP / CREDIT NOTE               */}
      {/* ========================================================= */}
      {slipReturn && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Return Credit Slip</span>
              </h3>
              <button
                onClick={() => setSlipReturn(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slip Paper View */}
            <div
              id="return-slip-print"
              className="border border-slate-300 rounded-xl p-5 bg-white font-mono text-xs space-y-3 shadow-inner"
            >
              <div className="text-center border-b border-dashed border-slate-300 pb-3">
                <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                  CLOTHING SHOP POS
                </h2>
                <p className="text-[10px] text-slate-500 uppercase">Return & Credit Note</p>
                <p className="text-xs font-bold text-rose-700 mt-1">
                  Slip: {slipReturn.returnNumber}
                </p>
              </div>

              <div className="space-y-1 text-[11px] text-slate-700 border-b border-dashed border-slate-300 pb-3">
                <div>
                  Orig. Invoice: <strong>{slipReturn.order?.orderNumber || slipReturn.orderId}</strong>
                </div>
                <div>
                  Customer: <strong>{slipReturn.order?.customerName || "Walk-in Customer"}</strong>
                </div>
                <div>
                  Date:{" "}
                  {new Date(slipReturn.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <div className="space-y-1 border-b border-dashed border-slate-300 pb-3">
                <div className="font-bold text-slate-900">{slipReturn.productName}</div>
                <div className="text-[11px] text-slate-600">
                  {slipReturn.color} / {slipReturn.size} • SKU: {slipReturn.sku}
                </div>
                <div className="flex justify-between items-center text-xs pt-1">
                  <span>Return Qty:</span>
                  <strong className="text-slate-900">{slipReturn.quantity} pcs</strong>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Condition:</span>
                  <strong className="text-slate-900">
                    {slipReturn.condition === "SELLABLE" ? "Sellable (Restocked)" : "Damaged"}
                  </strong>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Refund Method:</span>
                  <strong className="text-slate-900">{slipReturn.refundMethod}</strong>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm font-extrabold pt-1">
                <span>TOTAL REFUND:</span>
                <span className="text-rose-700">₹{Number(slipReturn.refundAmount).toFixed(2)}</span>
              </div>

              {slipReturn.reason && (
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                  Reason: {slipReturn.reason}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSlipReturn(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
