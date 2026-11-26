"use client";

import React, { useRef } from "react";
import {
  X,
  Printer,
  CheckCircle2,
  ShoppingBag,
  Download,
  Share2,
  Calendar,
  User,
  CreditCard,
  IndianRupee,
  RotateCcw,
} from "lucide-react";
import BarcodeRenderer from "./BarcodeRenderer";

export interface BillOrderItem {
  id?: string;
  productName: string;
  sku: string;
  barcode?: string | null;
  size?: string | null;
  color?: string | null;
  price: number;
  quantity: number;
  total: number;
}

export interface BillOrderData {
  id?: string;
  orderNumber: string;
  customerName?: string | null;
  customerPhone?: string | null;
  subtotal: number;
  discountAmount: number;
  couponCode?: string | null;
  taxRate?: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  amountPaid?: number;
  changeReturned?: number;
  createdAt?: string;
  items: BillOrderItem[];
  cashierName?: string;
}

interface PaymentBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: BillOrderData | null;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  gstin?: string;
  onStartNewSale?: () => void;
}

export default function PaymentBillModal({
  isOpen,
  onClose,
  order,
  storeName = "CLOTHING SHOP POS",
  storeAddress = "Shop 14, High Street Fashion Hub, MG Road",
  storePhone = "+91 98765 43210",
  gstin = "07AAAAA0000A1Z5",
  onStartNewSale,
}: PaymentBillModalProps) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

  const formattedTime = order.createdAt
    ? new Date(order.createdAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });

  return (
    <>
      {/* Thermal & Standard Print CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #pos-printable-bill,
          #pos-printable-bill * {
            visibility: visible;
          }
          #pos-printable-bill {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            max-width: 80mm;
            margin: 0 auto;
            padding: 8px 12px;
            background: white !important;
            color: black !important;
            font-family: monospace, sans-serif !important;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>

      {/* Hidden printable receipt for thermal / laser printers */}
      <div id="pos-printable-bill" className="hidden print:block text-black bg-white">
        <div className="text-center border-b border-black pb-2 mb-2">
          <h2 className="text-base font-black tracking-wider uppercase">{storeName}</h2>
          <p className="text-[11px] leading-tight">{storeAddress}</p>
          <p className="text-[10px]">Ph: {storePhone} | GST: {gstin}</p>
        </div>

        <div className="text-[10px] border-b border-black pb-1 mb-2">
          <div className="flex justify-between">
            <span>Bill: {order.orderNumber}</span>
            <span>{formattedDate} {formattedTime}</span>
          </div>
          <div className="flex justify-between">
            <span>Customer: {order.customerName || "Walk-in"}</span>
            {order.customerPhone && <span>Ph: {order.customerPhone}</span>}
          </div>
        </div>

        {/* Item Table */}
        <table className="w-full text-[10px] mb-2">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left pb-1">Item</th>
              <th className="text-center pb-1">Qty</th>
              <th className="text-right pb-1">Price</th>
              <th className="text-right pb-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it, idx) => (
              <tr key={idx} className="border-b border-dotted border-gray-400">
                <td className="py-1">
                  <div className="font-bold leading-tight">{it.productName}</div>
                  {(it.size || it.color) && (
                    <div className="text-[9px] text-gray-700">
                      {it.size ? `Size:${it.size} ` : ""}{it.color ? `Color:${it.color}` : ""}
                    </div>
                  )}
                </td>
                <td className="text-center py-1">{it.quantity}</td>
                <td className="text-right py-1">₹{Number(it.price).toFixed(2)}</td>
                <td className="text-right py-1 font-bold">₹{Number(it.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="text-[10px] space-y-0.5 border-t border-black pt-1 mb-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{Number(order.subtotal).toFixed(2)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between font-bold">
              <span>Discount {order.couponCode ? `(${order.couponCode})` : ""}:</span>
              <span>-₹{Number(order.discountAmount).toFixed(2)}</span>
            </div>
          )}
          {order.taxAmount > 0 && (
            <div className="flex justify-between">
              <span>GST / Tax ({order.taxRate || 0}%):</span>
              <span>₹{Number(order.taxAmount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs font-black border-t border-black pt-1">
            <span>GRAND TOTAL:</span>
            <span>₹{Number(order.totalAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[10px] pt-1">
            <span>Payment ({order.paymentMethod}):</span>
            <span>₹{Number(order.amountPaid || order.totalAmount).toFixed(2)}</span>
          </div>
          {order.changeReturned ? (
            <div className="flex justify-between text-[10px]">
              <span>Change Returned:</span>
              <span>₹{Number(order.changeReturned).toFixed(2)}</span>
            </div>
          ) : null}
        </div>

        {/* Invoice Barcode */}
        <div className="text-center my-2 flex flex-col items-center">
          <BarcodeRenderer
            value={order.orderNumber}
            height={32}
            moduleWidth={1.2}
            showText={true}
          />
        </div>

        <div className="text-center text-[9px] border-t border-black pt-1">
          <p className="font-bold">THANK YOU FOR SHOPPING WITH US!</p>
          <p>Goods once sold can be exchanged within 7 days with bill & tag.</p>
        </div>
      </div>

      {/* Screen Interactive Bill Modal */}
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="bg-emerald-600 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-base leading-tight">
                  Sale Completed & Bill Generated!
                </h3>
                <p className="text-emerald-100 text-xs">
                  Invoice {order.orderNumber} • Stock auto-updated
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Bill Body (Scrollable Receipt View) */}
          <div className="p-6 overflow-y-auto space-y-5 bg-slate-50/50">
            {/* Receipt Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 relative">
              {/* Receipt Header */}
              <div className="text-center border-b border-dashed border-slate-200 pb-3">
                <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600 block">
                  {storeName}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">{storeAddress}</p>
                <p className="text-[11px] text-slate-400">
                  Tel: {storePhone} • GSTIN: {gstin}
                </p>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Invoice No.
                  </span>
                  <span className="font-bold text-slate-900 font-mono">
                    {order.orderNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Date & Time
                  </span>
                  <span className="font-medium text-slate-700">
                    {formattedDate}, {formattedTime}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Customer
                  </span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {order.customerName || "Walk-in Customer"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Payment Method
                  </span>
                  <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[11px]">
                    {order.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Purchased Items ({order.items.reduce((s, i) => s + (i.quantity || 1), 0)})
                </span>
                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-900 truncate">
                          {item.productName}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          {item.size && (
                            <span className="bg-slate-100 text-slate-700 font-semibold px-1.5 py-0.2 rounded text-[10px]">
                              {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="bg-slate-100 text-slate-700 font-medium px-1.5 py-0.2 rounded text-[10px]">
                              {item.color}
                            </span>
                          )}
                          <span className="font-mono text-slate-400">
                            {item.quantity} × ₹{Number(item.price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 whitespace-nowrap">
                        ₹{Number(item.total).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="border-t border-dashed border-slate-200 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{Number(order.subtotal).toFixed(2)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>
                      Discount {order.couponCode ? `(Coupon: ${order.couponCode})` : ""}:
                    </span>
                    <span>-₹{Number(order.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                {order.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>GST / Tax ({order.taxRate || 0}%):</span>
                    <span>₹{Number(order.taxAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm font-black text-slate-900 border-t border-slate-200 pt-2">
                  <span>Grand Total:</span>
                  <span className="text-lg text-indigo-600">
                    ₹{Number(order.totalAmount).toFixed(2)}
                  </span>
                </div>

                {order.paymentMethod === "CASH" && order.amountPaid && order.amountPaid > 0 && (
                  <div className="bg-slate-50 p-2 rounded-lg flex justify-between text-[11px] text-slate-600 mt-1">
                    <span>Cash Tendered: ₹{Number(order.amountPaid).toFixed(2)}</span>
                    <span className="font-bold text-emerald-700">
                      Change: ₹{Number(order.changeReturned || 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Invoice Barcode for Return / Exchange scanning */}
              <div className="border-t border-dashed border-slate-200 pt-3 flex flex-col items-center">
                <p className="text-[10px] text-slate-400 uppercase font-medium mb-1">
                  Scan Barcode for Quick Return / Exchange
                </p>
                <BarcodeRenderer
                  value={order.orderNumber}
                  height={38}
                  moduleWidth={1.3}
                  showText={true}
                />
              </div>

              {/* Shop Footer Policy */}
              <div className="text-center text-[10px] text-slate-400 pt-1">
                Thank you for your visit! Returns/Exchanges accepted within 7 days.
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-2xl shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bill / Receipt</span>
            </button>

            {onStartNewSale && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartNewSale();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-100 transition active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Next Customer (New Sale)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
