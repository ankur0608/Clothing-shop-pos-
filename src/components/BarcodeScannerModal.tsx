"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Camera,
  Search,
  ScanLine,
  Package,
  Tag,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Printer,
  ShoppingBag,
  Volume2,
  RotateCcw,
} from "lucide-react";
import { playScannerBeep } from "@/lib/sound";
import BarcodeRenderer from "./BarcodeRenderer";

interface MatchedProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  category: string;
  price: number | string;
  stock: number;
  isActive: boolean;
  variants?: any[];
}

interface MatchedVariant {
  id: string;
  sku: string;
  barcode: string | null;
  size: string;
  color: string;
  price: number;
  costPrice: number;
  stock: number;
  isActive: boolean;
}

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: MatchedProduct, variant?: MatchedVariant | null) => void;
  onOpenLabelModal?: (product: any) => void;
  actionButtonLabel?: string;
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onSelectProduct,
  onOpenLabelModal,
  actionButtonLabel = "Add to Cart / Bill",
}: BarcodeScannerModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedProduct, setScannedProduct] = useState<MatchedProduct | null>(null);
  const [scannedVariant, setScannedVariant] = useState<MatchedVariant | null>(null);
  const [matchType, setMatchType] = useState<"PRODUCT" | "VARIANT" | null>(null);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scanIntervalRef = useRef<any>(null);

  // Focus input automatically when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    } else {
      stopCamera();
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setCode("");
    setError(null);
    setScannedProduct(null);
    setScannedVariant(null);
    setMatchType(null);
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported on this browser or connection.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);

      // Start BarcodeDetector loop if supported by browser
      if ("BarcodeDetector" in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ["code_128", "ean_13", "ean_8", "upc_a", "upc_e", "qr_code", "code_39"],
        });

        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === 4) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                const detectedCode = barcodes[0].rawValue;
                if (detectedCode) {
                  stopCamera();
                  handleLookup(detectedCode);
                }
              }
            } catch (err) {
              // Ignore single frame detect error
            }
          }
        }, 300);
      }
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      setCameraError(err.message || "Could not access camera. Please enter barcode manually.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Perform Barcode / SKU Lookup
  const handleLookup = async (searchCode: string) => {
    const trimmed = searchCode.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setCode(trimmed);

    try {
      const res = await fetch(`/api/admin/products/lookup?code=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (!res.ok || !data.found) {
        playScannerBeep(false);
        setError(data.error || `No product found for barcode "${trimmed}"`);
        setScannedProduct(null);
        setScannedVariant(null);
        return;
      }

      // Successful Scan!
      playScannerBeep(true);
      setScannedProduct(data.product);
      setScannedVariant(data.matchedVariant || null);
      setMatchType(data.matchType);
    } catch (err: any) {
      playScannerBeep(false);
      setError(err.message || "Failed to search product barcode");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code) {
      handleLookup(code);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Barcode Scanner & Product Info
              </h3>
              <p className="text-xs text-slate-500">
                Scan product tag or type barcode to fetch real-time store details
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Barcode Input & Scanner Mode Bar */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Scan barcode gun or type code (e.g. 890123456789)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-sans focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lookup"}
              </button>

              <button
                type="button"
                onClick={isCameraActive ? stopCamera : startCamera}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                  isCameraActive
                    ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
                title="Toggle Camera Barcode Scanner"
              >
                <Camera className="w-4 h-4" />
                <span>{isCameraActive ? "Stop Cam" : "Camera"}</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Hardware barcode guns work automatically on scan</span>
              <span className="flex items-center gap-1 text-slate-500 font-medium">
                <Volume2 className="w-3.5 h-3.5 text-indigo-500" /> Sound beep enabled
              </span>
            </div>
          </form>

          {/* Camera Viewfinder */}
          {isCameraActive && (
            <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-indigo-600 aspect-video flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Scan Reticle & Line Animation */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                <div className="w-4/5 h-3/5 border-2 border-white/80 rounded-xl relative shadow-lg">
                  {/* Corner brackets */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-indigo-500" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-indigo-500" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-indigo-500" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-indigo-500" />

                  {/* Animated laser scan line */}
                  <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse absolute top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-white text-xs font-semibold mt-3 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                  Point camera at product barcode
                </p>
              </div>
            </div>
          )}

          {cameraError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Product Not Found</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Scanned Product Info Display Card */}
          {scannedProduct && (
            <div className="border border-indigo-100 bg-indigo-50/30 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Product Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
                    {scannedProduct.category}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1">
                    {scannedProduct.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    SKU: {scannedProduct.sku}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                    Current Price
                  </span>
                  <span className="text-xl font-extrabold text-indigo-600">
                    ₹
                    {Number(
                      scannedVariant ? scannedVariant.price : scannedProduct.price
                    ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Matched Variant Highlight (if matched specific size/color combo) */}
              {scannedVariant && (
                <div className="bg-white border border-indigo-200 rounded-xl p-3.5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-indigo-600" />
                      Matched Variant Details
                    </span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      {scannedVariant.sku}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">
                        SIZE
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {scannedVariant.size}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">
                        COLOR
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {scannedVariant.color}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">
                        STOCK
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          scannedVariant.stock > 5
                            ? "text-emerald-600"
                            : scannedVariant.stock > 0
                            ? "text-amber-600"
                            : "text-rose-600"
                        }`}
                      >
                        {scannedVariant.stock > 0
                          ? `${scannedVariant.stock} in store`
                          : "Out of Stock"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* All Product Variants Matrix */}
              {scannedProduct.variants && scannedProduct.variants.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>All Available Sizes & Colors in Store</span>
                    <span className="text-[11px] text-slate-400">
                      {scannedProduct.variants.length} combinations
                    </span>
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {scannedProduct.variants.map((v: any) => {
                      const isCurrentMatched = scannedVariant?.id === v.id;
                      return (
                        <div
                          key={v.id}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs transition ${
                            isCurrentMatched
                              ? "bg-indigo-600 text-white font-semibold shadow-sm"
                              : "bg-white text-slate-700 border border-slate-100 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border border-current">
                              {v.size}
                            </span>
                            <span>{v.color}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[11px]">
                              ₹{Number(v.price).toFixed(2)}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isCurrentMatched
                                  ? "bg-indigo-700 text-white"
                                  : v.stock > 0
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {v.stock > 0 ? `${v.stock} left` : "Out"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Barcode Tag Preview inside Info Card */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Product Barcode
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {scannedVariant?.barcode || scannedProduct.barcode || scannedProduct.sku}
                  </span>
                </div>
                <BarcodeRenderer
                  value={
                    scannedVariant?.barcode ||
                    scannedProduct.barcode ||
                    scannedProduct.sku
                  }
                  height={28}
                  moduleWidth={1.2}
                  showText={false}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                {onSelectProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectProduct(scannedProduct, scannedVariant);
                      resetState();
                      inputRef.current?.focus();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{actionButtonLabel}</span>
                  </button>
                )}

                {onOpenLabelModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenLabelModal({
                        name: scannedProduct.name,
                        category: scannedProduct.category,
                        sku: scannedVariant ? scannedVariant.sku : scannedProduct.sku,
                        barcode:
                          scannedVariant?.barcode ||
                          scannedProduct.barcode ||
                          scannedProduct.sku,
                        price: scannedVariant ? scannedVariant.price : scannedProduct.price,
                        size: scannedVariant?.size || null,
                        color: scannedVariant?.color || null,
                      });
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Print Label</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    resetState();
                    inputRef.current?.focus();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl transition"
                  title="Scan next barcode"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Scan Next</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>Press Enter after typing or use hardware scanner</span>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-3 py-1.5 font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
