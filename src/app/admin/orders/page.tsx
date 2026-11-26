"use client";

import React, { useState, useEffect } from "react";
import {
  Receipt,
  Search,
  Printer,
  Calendar,
  IndianRupee,
  CreditCard,
  QrCode,
  User,
  ShoppingBag,
  Loader2,
  RefreshCw,
  Eye,
  Filter,
} from "lucide-react";
import PaymentBillModal, { BillOrderData } from "@/components/PaymentBillModal";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<BillOrderData | null>(null);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (paymentFilter) params.set("paymentMethod", paymentFilter);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error("Failed to load orders:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [paymentFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleViewBill = (order: any) => {
    const formatted: BillOrderData = {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount || 0),
      couponCode: order.couponCode,
      taxRate: Number(order.taxRate || 0),
      taxAmount: Number(order.taxAmount || 0),
      totalAmount: Number(order.totalAmount),
      paymentMethod: order.paymentMethod,
      amountPaid: Number(order.amountPaid || order.totalAmount),
      changeReturned: Number(order.changeReturned || 0),
      createdAt: order.createdAt,
      items: (order.items || []).map((it: any) => ({
        productName: it.productName,
        sku: it.sku,
        barcode: it.barcode,
        size: it.size,
        color: it.color,
        price: Number(it.price),
        quantity: Number(it.quantity),
        total: Number(it.total),
      })),
    };
    setSelectedOrder(formatted);
    setIsBillModalOpen(true);
  };

  // Stats calculation
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const totalBills = orders.length;
  const cashSales = orders
    .filter((o) => o.paymentMethod === "CASH")
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const upiSales = orders
    .filter((o) => o.paymentMethod === "UPI")
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-600" />
            Billing & Sales History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            View generated store receipts, sales performance, and reprint invoices
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">
            Total Revenue
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-indigo-600">
              ₹{totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all completed bills</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">
            Invoices Generated
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-slate-900">{totalBills}</span>
            <span className="text-xs text-slate-500 font-medium">bills</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total customer transactions</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">
            Cash Collections
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-emerald-600">
              ₹{cashSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Physical cash drawer total</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">
            UPI & Online Payments
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-violet-600">
              ₹{upiSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Digital QR & Card receipts</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Invoice No. (INV-...), Customer Name, or Phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none"
          >
            <option value="">All Payment Modes</option>
            <option value="CASH">Cash Only</option>
            <option value="UPI">UPI Only</option>
            <option value="CARD">Card Only</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-700 text-sm">No sales records yet</h3>
            <p className="text-xs text-slate-400 mt-1">
              Sales made through the POS Billing Terminal will show here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Invoice No</th>
                  <th className="px-5 py-3.5 font-bold">Date & Time</th>
                  <th className="px-5 py-3.5 font-bold">Customer</th>
                  <th className="px-5 py-3.5 font-bold">Items Sold</th>
                  <th className="px-5 py-3.5 font-bold">Payment</th>
                  <th className="px-5 py-3.5 font-bold text-right">Grand Total</th>
                  <th className="px-5 py-3.5 font-bold text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-600">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      <span className="block text-[10px] text-slate-400">
                        {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-800">
                      <span className="font-semibold block">
                        {order.customerName || "Walk-in Customer"}
                      </span>
                      {order.customerPhone && (
                        <span className="text-[10px] text-slate-400">
                          {order.customerPhone}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {order.items?.length || 0} product{(order.items?.length || 0) > 1 ? "s" : ""}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.paymentMethod === "CASH"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : order.paymentMethod === "UPI"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : "bg-violet-50 text-violet-700 border border-violet-200"
                        }`}
                      >
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-extrabold text-slate-900 text-sm">
                      ₹{Number(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleViewBill(order)}
                        className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-lg transition inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                        title="View & Print Bill"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bill & Receipt View Modal */}
      <PaymentBillModal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
}
