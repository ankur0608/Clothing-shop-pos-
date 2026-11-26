"use client";

import React, { useState } from "react";
import { X, Printer, Tag, Sparkles, Check, Copy } from "lucide-react";
import BarcodeRenderer from "./BarcodeRenderer";

export interface LabelProductData {
  name: string;
  category?: string;
  sku: string;
  barcode: string;
  price: number | string;
  costPrice?: number | string;
  size?: string | null;
  color?: string | null;
}

interface BarcodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: LabelProductData | null;
  storeName?: string;
}

export default function BarcodeLabelModal({
  isOpen,
  onClose,
  product,
  storeName = "CLOTHING SHOP POS",
}: BarcodeLabelModalProps) {
  const [copies, setCopies] = useState<number>(4);
  const [shopName, setShopName] = useState<string>(storeName);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !product) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyBarcode = () => {
    if (!product.barcode) return;
    navigator.clipboard.writeText(product.barcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedPrice = Number(product.price || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <>
      {/* Printable Sheet (hidden on screen, visible during print) */}
      <div id="printable-barcode-sheet" className="hidden print:block print:w-full print:p-2 bg-white text-black">
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-barcode-sheet,
            #printable-barcode-sheet * {
              visibility: visible;
            }
            #printable-barcode-sheet {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
              color: black !important;
            }
            @page {
              margin: 8mm;
              size: auto;
            }
          }
        `}</style>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: copies }).map((_, idx) => (
            <div
              key={idx}
              className="border-2 border-dashed border-slate-400 rounded-lg p-3 flex flex-col items-center justify-between text-center bg-white page-break-inside-avoid h-[180px]"
            >
              <div className="w-full border-b border-slate-300 pb-1 mb-1">
                <span className="text-[11px] font-black tracking-widest uppercase block text-slate-900">
                  {shopName}
                </span>
                <span className="text-[10px] font-semibold text-slate-800 line-clamp-1 truncate block">
                  {product.name}
                </span>
              </div>

              {(product.size || product.color) && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-700 my-0.5">
                  {product.size && (
                    <span className="border border-slate-400 px-1.5 py-0.2 rounded">
                      SIZE: {product.size}
                    </span>
                  )}
                  {product.color && (
                    <span className="border border-slate-400 px-1.5 py-0.2 rounded">
                      COLOR: {product.color}
                    </span>
                  )}
                </div>
              )}

              <div className="my-1">
                <BarcodeRenderer
                  value={product.barcode || product.sku}
                  height={38}
                  moduleWidth={1.4}
                  showText={true}
                />
              </div>

              <div className="w-full flex items-center justify-between border-t border-slate-300 pt-1 mt-1 text-[11px]">
                <span className="text-[9px] text-slate-600 font-mono">
                  {product.sku}
                </span>
                <span className="font-extrabold text-slate-950 text-xs">
                  MRP: ₹{formattedPrice}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Screen Modal */}
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Generate & Print Clothing Label
                </h3>
                <p className="text-xs text-slate-500">
                  Ready-to-stick price tag and scannable barcode for clothing
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Label Visual Tag Preview */}
            <div className="flex flex-col items-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Tag Preview (Hangtag / Sticker)
              </p>
              <div className="w-72 bg-gradient-to-b from-white to-slate-50 border-2 border-slate-800 rounded-2xl shadow-lg p-4 flex flex-col items-center relative text-center">
                {/* Hole punch for hangtag cord */}
                <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-700 bg-slate-200 mb-2" />

                <span className="text-[12px] font-black tracking-widest text-slate-900 uppercase">
                  {shopName}
                </span>
                <p className="text-xs font-bold text-slate-800 mt-1 line-clamp-2 px-1">
                  {product.name}
                </p>

                {/* Variant badges */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap justify-center">
                  {product.category && (
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                      {product.category}
                    </span>
                  )}
                  {product.size && (
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
                      Size: {product.size}
                    </span>
                  )}
                  {product.color && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                      Color: {product.color}
                    </span>
                  )}
                </div>

                {/* Scannable Barcode */}
                <div className="my-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-full flex justify-center">
                  <BarcodeRenderer
                    value={product.barcode || product.sku}
                    height={46}
                    moduleWidth={1.5}
                    showText={true}
                  />
                </div>

                {/* Price & SKU */}
                <div className="w-full border-t border-slate-200 pt-2 flex items-center justify-between text-left">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block">
                      SKU
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-slate-700">
                      {product.sku}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block">
                      MRP (incl. tax)
                    </span>
                    <span className="text-base font-extrabold text-indigo-600">
                      ₹{formattedPrice}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Barcode Copy / Verification */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  Scannable Barcode Value
                </span>
                <span className="text-sm font-mono font-bold text-slate-800">
                  {product.barcode || product.sku}
                </span>
              </div>
              <button
                onClick={handleCopyBarcode}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Barcode</span>
                  </>
                )}
              </button>
            </div>

            {/* Configuration Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Store / Brand Name on Tag
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                  placeholder="e.g. YOUR BOUTIQUE"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Number of Copies to Print
                </label>
                <div className="flex items-center gap-2">
                  {[1, 4, 8, 12, 24].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCopies(num)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${
                        copies === num
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Prints {copies} barcode label{copies > 1 ? "s" : ""} on your printer
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print {copies} Label{copies > 1 ? "s" : ""} Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
