"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Volume2,
  VolumeX,
  Smartphone,
  Laptop,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { playScannerBeep } from "@/lib/sound";

export default function MobileScannerPage() {
  const [sessionId, setSessionId] = useState<string>("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [sending, setSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Scan feedback
  const [lastScanned, setLastScanned] = useState<{
    barcode: string;
    productInfo?: any;
    time: string;
  } | null>(null);
  const [scanCount, setScanCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);
  const lastScannedCodeRef = useRef<string>("");
  const lastScannedTimeRef = useRef<number>(0);

  // Parse sessionId from URL query params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sid = params.get("session") || params.get("sid") || "pos_terminal";
      setSessionId(sid);
    }
  }, []);

  // Start camera on mount
  useEffect(() => {
    if (sessionId) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [sessionId]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not accessible on this device.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);

      // Start BarcodeDetector loop if supported
      if ("BarcodeDetector" in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ["code_128", "ean_13", "ean_8", "upc_a", "upc_e", "qr_code", "code_39"],
        });

        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === 4) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                const detectedCode = barcodes[0].rawValue?.trim();
                const now = Date.now();

                // Prevent repeat scans of the exact same barcode within 1.5 seconds
                if (
                  detectedCode &&
                  (detectedCode !== lastScannedCodeRef.current ||
                    now - lastScannedTimeRef.current > 1500)
                ) {
                  lastScannedCodeRef.current = detectedCode;
                  lastScannedTimeRef.current = now;
                  sendBarcodeToLaptop(detectedCode);
                }
              }
            } catch (err) {
              // Frame dropped or detection failed
            }
          }
        }, 250);
      }
    } catch (err: any) {
      console.warn("Mobile camera error:", err);
      setCameraError(
        err.message || "Camera permission denied or camera not found on this device."
      );
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

  const sendBarcodeToLaptop = async (barcode: string) => {
    const trimmed = barcode.trim();
    if (!trimmed || !sessionId) return;

    if (soundEnabled) {
      playScannerBeep(true);
    }

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(80);
    }

    setSending(true);

    try {
      const res = await fetch("/api/admin/pos/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          barcode: trimmed,
        }),
      });

      const data = await res.json();

      setLastScanned({
        barcode: trimmed,
        productInfo: data.productInfo || null,
        time: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      });

      setScanCount((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to sync barcode to laptop:", err);
    } finally {
      setSending(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      sendBarcodeToLaptop(manualCode.trim());
      setManualCode("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none">
      {/* Top Mobile Bar */}
      <header className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm">Mobile Barcode Gun</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <p className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
              Session: {sessionId || "connecting..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            title="Toggle Scan Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
          <div className="px-2.5 py-1 bg-indigo-950 border border-indigo-700/60 rounded-lg text-xs font-bold text-indigo-300">
            {scanCount} sent
          </div>
        </div>
      </header>

      {/* Main Viewfinder Section */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Camera Video View */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Laser Reticle Overlay */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
            <div className="w-72 h-48 border-2 border-white/60 rounded-2xl relative shadow-2xl flex items-center justify-center">
              {/* Corner brackets */}
              <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
              <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />

              {/* Scanning red laser line */}
              <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-pulse" />
            </div>

            <p className="mt-4 text-xs font-semibold bg-black/70 px-4 py-1.5 rounded-full text-slate-200 backdrop-blur-sm border border-white/10">
              Align clothing barcode inside box
            </p>
          </div>

          {/* Sync Connection Banner */}
          <div className="absolute top-4 inset-x-4 bg-slate-900/90 border border-slate-700 rounded-xl p-2.5 backdrop-blur-sm flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-300">Live Linked to Laptop POS</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              READY TO SCAN
            </span>
          </div>

          {/* Camera Error Message */}
          {cameraError && (
            <div className="absolute inset-x-4 bottom-24 bg-rose-950/90 border border-rose-800 p-4 rounded-2xl text-xs text-rose-200">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Camera Notice</span>
              </div>
              <p>{cameraError}</p>
              <button
                onClick={startCamera}
                className="mt-3 w-full py-2 bg-rose-800 text-white font-bold rounded-xl text-center"
              >
                Retry Camera
              </button>
            </div>
          )}
        </div>

        {/* Floating Last Scanned Card */}
        {lastScanned && (
          <div className="p-3 bg-slate-900 border-t border-slate-800 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-xs text-white truncate">
                    {lastScanned.productInfo?.name || "Product Scanned"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                  <span>{lastScanned.barcode}</span>
                  {lastScanned.productInfo?.size && (
                    <span className="text-indigo-400 font-bold">
                      Size: {lastScanned.productInfo.size}
                    </span>
                  )}
                  {lastScanned.productInfo?.color && (
                    <span className="text-amber-400">
                      {lastScanned.productInfo.color}
                    </span>
                  )}
                </div>
              </div>

              {lastScanned.productInfo?.price !== undefined && (
                <div className="text-right shrink-0 pl-2">
                  <span className="text-sm font-extrabold text-emerald-400">
                    ₹{Number(lastScanned.productInfo.price).toFixed(2)}
                  </span>
                  <span className="block text-[9px] text-slate-500">Sent to laptop</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manual Barcode Input Fallback */}
        <div className="p-3 bg-slate-950 border-t border-slate-900">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Or type barcode number..."
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={sending || !manualCode.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
