"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Barcode as BarcodeIcon,
  Printer,
  Search,
  Plus,
  RefreshCw,
  Tag,
  CheckCircle2,
  Copy,
  Check,
  Package,
  Layers,
  Shirt,
  Sparkles,
  Info,
  Settings2,
  Sliders,
} from "lucide-react";
import BarcodeRenderer from "@/components/BarcodeRenderer";

interface VariantItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  sku: string;
  barcode: string;
  size: string;
  color: string;
  price: number;
  costPrice?: number;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  price: number;
  costPrice?: number;
  variants: {
    id: string;
    productId: string;
    sku: string;
    barcode?: string;
    size: string;
    color: string;
    price: number;
    costPrice?: number;
    stock: number;
  }[];
}

export default function BarcodeLabelsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [labelCount, setLabelCount] = useState<number>(1);
  const [labelSize, setLabelSize] = useState<"50x30" | "38x25" | "60x40" | "40x20">("50x30");
  const [shopName, setShopName] = useState<string>("CLOTHING SHOP POS");
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showMrp, setShowMrp] = useState<boolean>(true);
  const [showSku, setShowSku] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);

  // Fetch products & flatten variants
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (res.ok && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error("Failed to load products for barcodes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Flatten all variants with product info
  const allVariants = useMemo<VariantItem[]>(() => {
    const list: VariantItem[] = [];
    products.forEach((p) => {
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v) => {
          list.push({
            id: v.id,
            productId: p.id,
            productName: p.name,
            category: p.category,
            sku: v.sku || `${p.sku}-${v.color.slice(0, 3)}-${v.size}`,
            barcode: v.barcode || v.sku || `${p.sku}-${v.color.slice(0, 3)}-${v.size}`,
            size: v.size,
            color: v.color,
            price: Number(v.price || p.price || 0),
            costPrice: Number(v.costPrice || p.costPrice || 0),
            stock: Number(v.stock || 0),
          });
        });
      } else {
        // Base product fallback if no variants
        list.push({
          id: p.id,
          productId: p.id,
          productName: p.name,
          category: p.category,
          sku: p.sku,
          barcode: p.barcode || p.sku,
          size: "Standard",
          color: "Standard",
          price: Number(p.price || 0),
          costPrice: Number(p.costPrice || 0),
          stock: 0,
        });
      }
    });
    return list;
  }, [products]);

  // Set default selection when variants load
  useEffect(() => {
    if (!selectedVariantId && allVariants.length > 0) {
      setSelectedVariantId(allVariants[0].id);
    }
  }, [allVariants, selectedVariantId]);

  // Selected variant object
  const currentVariant = useMemo(() => {
    return allVariants.find((v) => v.id === selectedVariantId) || allVariants[0] || null;
  }, [allVariants, selectedVariantId]);

  // Filtered variants for quick catalog browse
  const filteredVariants = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allVariants;
    return allVariants.filter(
      (v) =>
        v.productName.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        v.barcode.toLowerCase().includes(q) ||
        v.size.toLowerCase().includes(q) ||
        v.color.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q)
    );
  }, [allVariants, search]);

  // Dimensions parsing
  const [labelWidthMm, labelHeightMm] = useMemo(() => {
    const [w, h] = labelSize.split("x").map(Number);
    return [w || 50, h || 30];
  }, [labelSize]);

  const handleCopyBarcode = () => {
    if (!currentVariant?.barcode) return;
    navigator.clipboard.writeText(currentVariant.barcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-4 sm:space-y-5 font-sans">
      {/* Printable Sheet (visible during window.print()) */}
      <div id="printable-barcode-sheet" className="hidden print:block print:w-full bg-white text-black">
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-barcode-sheet,
            #printable-barcode-sheet * {
              visibility: visible !important;
            }
            #printable-barcode-sheet {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .label-page {
              width: ${labelWidthMm}mm;
              height: ${labelHeightMm}mm;
              page-break-after: always;
              break-after: page;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 1.5mm;
              box-sizing: border-box;
              text-align: center;
              font-family: Arial, sans-serif;
            }
            .label-page:last-child {
              page-break-after: auto;
              break-after: auto;
            }
            @page {
              size: ${labelWidthMm}mm ${labelHeightMm}mm;
              margin: 0;
            }
          }
        `}</style>
        {currentVariant &&
          Array.from({ length: Math.min(200, Math.max(1, labelCount)) }).map((_, idx) => (
            <div key={idx} className="label-page border border-slate-300">
              {/* Store Header */}
              <div
                style={{
                  fontSize: labelHeightMm <= 25 ? "8px" : "10px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "100%",
                }}
              >
                {shopName}
              </div>

              {/* Product Title */}
              <div
                style={{
                  fontSize: labelHeightMm <= 25 ? "8px" : "9.5px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "100%",
                }}
              >
                {currentVariant.productName}
              </div>

              {/* Variant info */}
              <div
                style={{
                  fontSize: labelHeightMm <= 25 ? "7.5px" : "8.5px",
                  fontWeight: 600,
                  margin: "1px 0",
                }}
              >
                {currentVariant.color} / {currentVariant.size}
                {showPrice && ` • ₹${currentVariant.price.toFixed(2)}`}
              </div>

              {/* Barcode SVG */}
              <div style={{ margin: "2px 0" }}>
                <BarcodeRenderer
                  value={currentVariant.barcode}
                  height={labelHeightMm <= 25 ? 26 : 36}
                  moduleWidth={labelWidthMm <= 40 ? 1.1 : 1.35}
                  showText={true}
                />
              </div>

              {/* Footer SKU */}
              {showSku && (
                <div
                  style={{
                    fontSize: "7px",
                    fontFamily: "monospace",
                    color: "#333",
                  }}
                >
                  SKU: {currentVariant.sku}
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-1">
            <BarcodeIcon className="w-3.5 h-3.5" />
            <span>Thermal Tag Generator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Barcode Labels
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Print or reprint scannable Code 128 labels for each unique size/color variant.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchProducts}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-xs transition"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span>Refresh</span>
          </button>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-100 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Main Settings & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Select Variant and Label Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Select Variant and Label Settings</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pick any garment size/color combination and calibrate your thermal printer format.
              </p>
            </div>

            {/* Product Variant Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Product Variant *
              </label>
              {loading ? (
                <div className="text-xs text-slate-400 py-2">Loading variants...</div>
              ) : allVariants.length === 0 ? (
                <div className="text-xs text-slate-400 p-3 border rounded-xl">
                  No products or variants found. Please add a product first.
                </div>
              ) : (
                <select
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer transition"
                >
                  {allVariants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.productName} — {v.color} / {v.size} ({v.stock} pcs in stock)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Number of stickers & Label size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Number of Stickers
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={labelCount}
                    onChange={(e) => setLabelCount(Math.max(1, Math.min(200, parseInt(e.target.value, 10) || 1)))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                  <div className="flex gap-1">
                    {[1, 5, 10].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setLabelCount(n)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Label Size (Thermal Roll)
                </label>
                <select
                  value={labelSize}
                  onChange={(e) => setLabelSize(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
                >
                  <option value="50x30">50 × 30 mm (Standard Retail)</option>
                  <option value="38x25">38 × 25 mm (Compact Sticker)</option>
                  <option value="60x40">60 × 40 mm (Large Hangtag)</option>
                  <option value="40x20">40 × 20 mm (Mini Barcode)</option>
                </select>
              </div>
            </div>

            {/* Custom Store Header Text */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Sticker Header (Shop / Brand Name)
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. THREADLINE FASHIONS"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            {/* Display Toggles */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Include Selling Price</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSku}
                  onChange={(e) => setShowSku(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Include Variant SKU</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-100 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print {labelCount} Selected Label{labelCount > 1 ? "s" : ""}</span>
              </button>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-slate-400" />
                <span>Reprint Same Barcode</span>
              </button>

              <button
                onClick={handleCopyBarcode}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold transition"
                title="Copy barcode string"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Informational Callout */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-slate-600">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <p>
                The barcode stays the same when you receive more stock or print a replacement sticker.
                Use a scanner supporting <strong>Code 128</strong> in your POS counter.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Sticker Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                <span>Sticker Preview</span>
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                {labelSize.replace("x", " × ")} mm
              </span>
            </div>

            {/* Sticker Mockup */}
            {currentVariant ? (
              <div className="flex justify-center py-6 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                <div
                  className="bg-white border-2 border-slate-800 rounded-lg p-3 flex flex-col items-center justify-between text-center shadow-md select-none transition-all"
                  style={{
                    width: `${Math.min(320, labelWidthMm * 5.6)}px`,
                    minHeight: `${labelHeightMm * 4.6}px`,
                  }}
                >
                  {/* Shop Brand */}
                  <div className="w-full border-b border-slate-200 pb-1 mb-1">
                    <span className="text-[11px] font-black tracking-wider uppercase block text-slate-900 truncate">
                      {shopName || "CLOTHING SHOP POS"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-800 truncate block">
                      {currentVariant.productName}
                    </span>
                  </div>

                  {/* Size & Color chip */}
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-700 my-0.5">
                    <span className="border border-slate-300 px-1.5 py-0.2 rounded bg-slate-50">
                      {currentVariant.color} / {currentVariant.size}
                    </span>
                    {showPrice && (
                      <span className="font-extrabold text-slate-900">
                        MRP ₹{currentVariant.price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* High Quality Barcode Renderer */}
                  <div className="my-1.5 w-full flex justify-center">
                    <BarcodeRenderer
                      value={currentVariant.barcode}
                      height={labelHeightMm <= 25 ? 30 : 42}
                      moduleWidth={labelWidthMm <= 40 ? 1.2 : 1.5}
                      showText={true}
                    />
                  </div>

                  {/* Footer SKU */}
                  {showSku && (
                    <div className="w-full border-t border-slate-200 pt-1 mt-0.5 text-[8.5px] font-mono text-slate-500 flex justify-between items-center">
                      <span>SKU: {currentVariant.sku}</span>
                      <span className="font-bold text-emerald-700">
                        Stock: {currentVariant.stock} pcs
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No variant selected
              </div>
            )}

            {/* Calibration Note */}
            <p className="text-[11px] text-slate-400 leading-relaxed italic">
              <strong>Printer setup:</strong> configure paper size, gap, scaling, and margins in the printer driver.
              Browser printing may need calibration for your direct thermal printer (TVS, TSC, Zebra, Rollo, etc.).
            </p>
          </div>
        </div>
      </div>

      {/* Barcode Rules Cards */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Barcode Rules & Best Practices</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center mb-2">
              1
            </span>
            <h4 className="text-xs font-bold text-slate-900 mb-1">
              One Unique Barcode per Variant
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Every distinct color and size combination has its own barcode. This prevents selling a Red M when a Blue L was scanned.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center mb-2">
              2
            </span>
            <h4 className="text-xs font-bold text-slate-900 mb-1">
              Reprint Same Code on Restock
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              When new supplier stock arrives or a sticker gets damaged, reprint the existing code. Never assign a new barcode to an identical variant.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center mb-2">
              3
            </span>
            <h4 className="text-xs font-bold text-slate-900 mb-1">
              Instant Resolution at POS Billing
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Scanning the sticker in POS Billing instantly adds the exact color, size, and rate to the customer invoice in milliseconds.
            </p>
          </div>
        </div>
      </div>

      {/* Catalog Quick-Select Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shirt className="w-4 h-4 text-indigo-600" />
              <span>Catalog Variant Barcode Directory</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Browse all garment variants, inspect scanner codes, and click to load any sticker.
            </p>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search product, SKU, barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] sm:text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Variant</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Barcode (Code 128)</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredVariants.length > 0 ? (
                filteredVariants.slice(0, 30).map((v) => {
                  const isSelected = v.id === selectedVariantId;
                  return (
                    <tr
                      key={v.id}
                      className={`transition-colors ${
                        isSelected ? "bg-indigo-50/60 font-semibold" : "hover:bg-slate-50/80"
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {v.productName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {v.color} / {v.size}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {v.sku}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-indigo-700 font-bold whitespace-nowrap">
                        {v.barcode}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        ₹{v.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            v.stock > 3
                              ? "bg-emerald-50 text-emerald-700"
                              : v.stock > 0
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {v.stock} pcs
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedVariantId(v.id);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "border border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {isSelected ? "Selected" : "Select Label"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No matching variants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
