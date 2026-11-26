"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShoppingBag,
  ScanLine,
  Search,
  Plus,
  Minus,
  Trash2,
  Tag,
  CreditCard,
  IndianRupee,
  QrCode,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
  Shirt,
  Volume2,
  Sparkles,
  User,
  Phone,
  TicketPercent,
  Receipt,
  Layers,
  Percent,
} from "lucide-react";
import { playScannerBeep } from "@/lib/sound";
import BarcodeScannerModal from "@/components/BarcodeScannerModal";
import PaymentBillModal, { BillOrderData } from "@/components/PaymentBillModal";
import BarcodeLabelModal from "@/components/BarcodeLabelModal";
import BarcodeRenderer from "@/components/BarcodeRenderer";

export interface CartItem {
  cartId: string; // unique for product+variant combo
  productId: string;
  variantId?: string | null;
  name: string;
  sku: string;
  barcode?: string | null;
  category: string;
  size?: string | null;
  color?: string | null;
  price: number;
  costPrice?: number;
  quantity: number;
  maxStock: number;
}

export default function AdminPOSPage() {
  // Scanner & Search State
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Cart & Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Discounts & Tax State
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [manualDiscount, setManualDiscount] = useState<string>("0");
  const [taxRate, setTaxRate] = useState<number>(5); // Default 5% apparel GST

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD">("CASH");
  const [cashTendered, setCashTendered] = useState<string>("");
  const [processingOrder, setProcessingOrder] = useState(false);

  // Modals
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<BillOrderData | null>(null);
  const [labelProduct, setLabelProduct] = useState<any | null>(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

  // Catalog Quick Browse
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Variant Selection Modal (when clicking a multi-variant product from catalog)
  const [variantPickerProduct, setVariantPickerProduct] = useState<any | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus barcode scanner input on mount & shortcuts
  useEffect(() => {
    barcodeInputRef.current?.focus();
    fetchCatalog();

    // Keydown listener for F2 (focus scanner), F4 (clear cart), Ctrl+Enter (checkout)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch catalog products for quick manual browsing
  const fetchCatalog = async () => {
    try {
      setCatalogLoading(true);
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (res.ok && Array.isArray(data.products)) {
        setCatalogProducts(data.products);
      }
    } catch (e) {
      console.error("Failed to load catalog:", e);
    } finally {
      setCatalogLoading(false);
    }
  };

  // Add Item to Cart
  const addToCart = (product: any, variant?: any | null) => {
    const isVariant = !!variant;
    const cartId = isVariant ? `${product.id}_${variant.id}` : `${product.id}_base`;
    const price = Number(isVariant ? variant.price : product.price);
    const sku = isVariant ? variant.sku : product.sku;
    const barcode = isVariant ? variant.barcode : product.barcode;
    const size = isVariant ? variant.size : product.size;
    const color = isVariant ? variant.color : product.color;
    const maxStock = Number(isVariant ? variant.stock : product.stock) || 0;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.cartId === cartId);
      if (existingIndex > -1) {
        const currentQty = prevCart[existingIndex].quantity;
        if (currentQty >= maxStock && maxStock > 0) {
          setScanMessage({
            type: "error",
            text: `Cannot add more. Only ${maxStock} in stock for ${sku}`,
          });
          return prevCart;
        }
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: currentQty + 1,
        };
        return updated;
      } else {
        const newItem: CartItem = {
          cartId,
          productId: product.id,
          variantId: isVariant ? variant.id : null,
          name: product.name,
          sku,
          barcode,
          category: product.category,
          size,
          color,
          price,
          costPrice: Number(isVariant ? variant.costPrice : product.costPrice) || 0,
          quantity: 1,
          maxStock,
        };
        return [newItem, ...prevCart];
      }
    });

    playScannerBeep(true);
    setScanMessage({
      type: "success",
      text: `Added ${product.name} ${size ? `(${size})` : ""} to bill!`,
    });
    setTimeout(() => setScanMessage(null), 3000);
  };

  // Barcode Gun & Text Input Handler
  const handleBarcodeScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    setScanning(true);
    setScanMessage(null);

    try {
      const res = await fetch(`/api/admin/products/lookup?code=${encodeURIComponent(code)}`);
      const data = await res.json();

      if (!res.ok || !data.found) {
        playScannerBeep(false);
        setScanMessage({
          type: "error",
          text: data.error || `Barcode "${code}" not found in inventory`,
        });
        setBarcodeInput("");
        barcodeInputRef.current?.focus();
        return;
      }

      // Found product! Add immediately to cart!
      addToCart(data.product, data.matchedVariant || null);
      setBarcodeInput("");
      barcodeInputRef.current?.focus();
    } catch (err: any) {
      playScannerBeep(false);
      setScanMessage({
        type: "error",
        text: err.message || "Failed to scan barcode",
      });
    } finally {
      setScanning(false);
    }
  };

  // Quantity adjustments
  const updateQuantity = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartId === cartId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (item.maxStock > 0 && newQty > item.maxStock) {
              setScanMessage({
                type: "error",
                text: `Maximum available stock reached (${item.maxStock})`,
              });
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm("Clear current billing cart?")) {
      setCart([]);
      setAppliedCoupon(null);
      setCouponCode("");
      setManualDiscount("0");
      setCashTendered("");
      barcodeInputRef.current?.focus();
    }
  };

  // Financial Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Apply Coupon API
  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await fetch("/api/admin/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, orderAmount: subtotal }),
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setCouponError(data.error || "Invalid coupon code");
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon(data.coupon);
      setCouponError(null);
    } catch (err: any) {
      setCouponError(err.message || "Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
  };

  // Total discounts
  const couponDiscountAmount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;
  const flatDiscount = Math.max(0, Number(manualDiscount) || 0);
  const totalDiscount = Math.min(subtotal, couponDiscountAmount + flatDiscount);

  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const taxAmount = (taxableAmount * taxRate) / 100;
  const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

  // Cash Change Calculation
  const tendered = Number(cashTendered) || grandTotal;
  const changeDue = Math.max(0, tendered - grandTotal);

  // Checkout and Auto-Generate Bill
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Cart is empty! Scan a barcode first.");
      barcodeInputRef.current?.focus();
      return;
    }

    setProcessingOrder(true);
    try {
      const orderPayload = {
        customerName: customerName.trim() || "Walk-in Customer",
        customerPhone: customerPhone.trim(),
        items: cart.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          productName: i.name,
          sku: i.sku,
          barcode: i.barcode,
          size: i.size,
          color: i.color,
          price: i.price,
          costPrice: i.costPrice,
          quantity: i.quantity,
        })),
        subtotal,
        discountAmount: totalDiscount,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        taxRate,
        taxAmount,
        totalAmount: grandTotal,
        paymentMethod,
        amountPaid: tendered,
        changeReturned: changeDue,
      };

      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process sale");
      }

      // Successful Sale!
      playScannerBeep(true);

      const billData: BillOrderData = {
        orderNumber: data.order?.orderNumber || `INV-${Date.now()}`,
        customerName: customerName || "Walk-in Customer",
        customerPhone: customerPhone || undefined,
        subtotal,
        discountAmount: totalDiscount,
        couponCode: appliedCoupon?.code,
        taxRate,
        taxAmount,
        totalAmount: grandTotal,
        paymentMethod,
        amountPaid: tendered,
        changeReturned: changeDue,
        createdAt: data.order?.createdAt || new Date().toISOString(),
        items: cart.map((i) => ({
          productName: i.name,
          sku: i.sku,
          barcode: i.barcode,
          size: i.size,
          color: i.color,
          price: i.price,
          quantity: i.quantity,
          total: i.price * i.quantity,
        })),
      };

      setCompletedOrder(billData);
      setIsBillModalOpen(true);
      // Refresh catalog stock
      fetchCatalog();
    } catch (err: any) {
      alert(`Checkout failed: ${err.message}`);
    } finally {
      setProcessingOrder(false);
    }
  };

  const startNewSale = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCouponCode("");
    setAppliedCoupon(null);
    setManualDiscount("0");
    setCashTendered("");
    setCompletedOrder(null);
    setIsBillModalOpen(false);
    barcodeInputRef.current?.focus();
  };

  // Filter catalog
  const filteredCatalog = catalogProducts.filter((p) => {
    const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch =
      !catalogSearch ||
      p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (p.barcode && p.barcode.includes(catalogSearch));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top POS Action & Scanner Bar */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Brand & Mode Tag */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 text-base leading-tight">
                  POS Retail Billing
                </h1>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                  REAL-TIME SCANNER ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Scan product barcode gun or mobile camera to auto-add to bill
              </p>
            </div>
          </div>

          {/* Real-time Barcode Scanner Input Box */}
          <form
            onSubmit={handleBarcodeScan}
            className="flex items-center gap-2 w-full md:max-w-xl"
          >
            <div className="relative flex-1">
              <ScanLine className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-600 animate-pulse" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan product barcode (or press F2 to focus)..."
                className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border-2 border-indigo-200 focus:border-indigo-600 rounded-xl text-sm font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-sans focus:bg-white focus:outline-none transition shadow-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded pointer-events-none">
                AUTO-SCAN
              </span>
            </div>

            <button
              type="submit"
              disabled={scanning || !barcodeInput.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Scan"}
            </button>

            {/* Camera Scanner Trigger */}
            <button
              type="button"
              onClick={() => setIsScannerModalOpen(true)}
              className="px-3.5 py-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              title="Open Camera Barcode Scanner"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Camera</span>
            </button>
          </form>
        </div>

        {/* Scan Status Toast Banner */}
        {scanMessage && (
          <div
            className={`max-w-7xl mx-auto mt-2 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition animate-in fade-in duration-200 ${
              scanMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {scanMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{scanMessage.text}</span>
          </div>
        )}
      </header>

      {/* Main Split Layout: Left Cart / Bill, Right Catalog & Quick Pick */}
      <main className="max-w-7xl mx-auto w-full p-4 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: POS Cart & Checkout Terminal (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          {/* Cart Items Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
            {/* Cart Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <h2 className="font-bold text-slate-900 text-sm">
                  Current Bill Items ({cart.reduce((s, i) => s + i.quantity, 0)})
                </h2>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Cart
                </button>
              )}
            </div>

            {/* Cart Items Table */}
            <div className="p-4 flex-1 overflow-y-auto max-h-[360px] divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
                    <ScanLine className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    No items scanned yet
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Scan any clothing barcode with barcode gun or click items on the right catalog
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.cartId}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate">
                          {item.name}
                        </span>
                        {item.size && (
                          <span className="bg-indigo-50 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded text-[10px] border border-indigo-100">
                            {item.size}
                          </span>
                        )}
                        {item.color && (
                          <span className="bg-amber-50 text-amber-800 font-semibold px-1.5 py-0.5 rounded text-[10px] border border-amber-100">
                            {item.color}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                        <span>{item.sku}</span>
                        {item.barcode && <span>• {item.barcode}</span>}
                      </div>
                    </div>

                    {/* Unit Price */}
                    <div className="text-right shrink-0">
                      <span className="font-semibold text-slate-700">
                        ₹{item.price.toFixed(2)}
                      </span>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartId, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartId, 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="text-right w-20 shrink-0">
                      <span className="font-extrabold text-slate-900 text-sm">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.cartId)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50 shrink-0 cursor-pointer"
                      title="Remove from bill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Customer Details Inputs */}
            <div className="border-t border-slate-100 p-4 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name (Walk-in)"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Mobile No. (for WhatsApp Bill)"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Billing Calculations & Discounts Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            {/* Coupon & Manual Discount Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Coupon Section */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Coupon Code
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <TicketPercent className="w-4 h-4 text-emerald-600" />
                      <span>{appliedCoupon.code}</span>
                      <span className="text-[10px] font-normal text-emerald-700">
                        (-₹{couponDiscountAmount.toFixed(2)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. WELCOME20"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-3 py-2 bg-slate-800 hover:bg-black disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      {couponLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-[10px] text-rose-600 mt-1 font-medium">
                    {couponError}
                  </p>
                )}
              </div>

              {/* Tax / GST Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  GST / Tax Rate
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 5, 12, 18].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setTaxRate(rate)}
                      className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                        taxRate === rate
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items):</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Total Discount:</span>
                  <span>-₹{totalDiscount.toFixed(2)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST ({taxRate}%):</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-black text-slate-900 border-t border-slate-200 pt-2">
                <span>Net Total Payable:</span>
                <span className="text-xl text-indigo-600">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3 pt-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase">
                Select Payment Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    paymentMethod === "CASH"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <IndianRupee className="w-4 h-4" />
                  <span>Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("UPI")}
                  className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    paymentMethod === "UPI"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("CARD")}
                  className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    paymentMethod === "CARD"
                      ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Card</span>
                </button>
              </div>

              {/* Cash Tendered Calculator */}
              {paymentMethod === "CASH" && (
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-xs font-semibold text-emerald-900">
                      Cash Received from Customer:
                    </label>
                    <div className="relative w-36">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        placeholder={grandTotal.toString()}
                        className="w-full pl-6 pr-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 text-right"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs font-bold pt-1 border-t border-emerald-200/60 text-emerald-900">
                    <span>Change to Return:</span>
                    <span className="text-sm font-black text-emerald-700">
                      ₹{changeDue.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* UPI QR Display */}
              {paymentMethod === "UPI" && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-3">
                  <div className="w-16 h-16 bg-white border border-indigo-200 rounded-lg flex items-center justify-center shrink-0">
                    <QrCode className="w-12 h-12 text-indigo-700" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-indigo-950">
                      Scan to Pay ₹{grandTotal.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-indigo-700 mt-0.5">
                      Accepts Google Pay, PhonePe, Paytm, BHIM & all UPI apps
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Complete Sale & Generate Bill Button */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={processingOrder || cart.length === 0}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-100 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              {processingOrder ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating Payment Bill...</span>
                </>
              ) : (
                <>
                  <Printer className="w-5 h-5" />
                  <span>Complete Sale & Print Bill (₹{grandTotal.toFixed(2)})</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Right Column: Catalog Quick Browse & Barcode Lookup (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col flex-1">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shirt className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Quick Catalog Pick
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {filteredCatalog.length} items
              </span>
            </div>

            {/* Catalog Search & Category Tabs */}
            <div className="my-3 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Filter catalog by name, SKU..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                {["All", "Men", "Women", "Kids", "Accessories"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto max-h-[560px] space-y-2 pr-1">
              {catalogLoading ? (
                <div className="py-8 flex justify-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : filteredCatalog.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No products found
                </p>
              ) : (
                filteredCatalog.map((p) => {
                  const hasVariants = p.variants && p.variants.length > 0;
                  return (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {p.name}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            ({p.category})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                          <span>{p.sku}</span>
                          {p.barcode && <span>• {p.barcode}</span>}
                          <span
                            className={`font-semibold ${
                              p.stock > 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            • {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-slate-900 text-xs">
                          ₹{Number(p.price).toFixed(2)}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            if (hasVariants) {
                              setVariantPickerProduct(p);
                            } else {
                              addToCart(p, null);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{hasVariants ? "Variants" : "Add"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Variant Picker Drawer Modal */}
      {variantPickerProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Select Size & Color Variant
                </h3>
                <p className="text-xs text-slate-500">{variantPickerProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setVariantPickerProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {variantPickerProduct.variants.map((v: any) => (
                <div
                  key={v.id}
                  className="p-3 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-slate-50"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                        Size: {v.size}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {v.color}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {v.sku} • Stock: {v.stock}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">
                      ₹{Number(v.price).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      disabled={v.stock <= 0}
                      onClick={() => {
                        addToCart(variantPickerProduct, v);
                        setVariantPickerProduct(null);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Camera Modal */}
      <BarcodeScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onSelectProduct={(prod, variant) => {
          addToCart(prod, variant);
          setIsScannerModalOpen(false);
        }}
        onOpenLabelModal={(prod) => {
          setLabelProduct(prod);
          setIsLabelModalOpen(true);
        }}
      />

      {/* Label Printing Modal */}
      <BarcodeLabelModal
        isOpen={isLabelModalOpen}
        onClose={() => setIsLabelModalOpen(false)}
        product={labelProduct}
      />

      {/* Payment Bill & Receipt Modal */}
      <PaymentBillModal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        order={completedOrder}
        onStartNewSale={startNewSale}
      />
    </div>
  );
}
