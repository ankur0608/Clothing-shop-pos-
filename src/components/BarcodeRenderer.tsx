"use client";

import React, { useMemo } from "react";
import { encodeCode128B, getBarcodeRects } from "@/lib/barcode";

interface BarcodeRendererProps {
  value: string;
  height?: number;
  moduleWidth?: number;
  showText?: boolean;
  className?: string;
  textColor?: string;
  barColor?: string;
  bgColor?: string;
}

export default function BarcodeRenderer({
  value,
  height = 54,
  moduleWidth = 1.8,
  showText = true,
  className = "",
  textColor = "#0f172a",
  barColor = "#000000",
  bgColor = "#ffffff",
}: BarcodeRendererProps) {
  const { rects, totalWidth } = useMemo(() => {
    if (!value) return { rects: [], totalWidth: 0 };
    const modules = encodeCode128B(value);
    const calculatedRects = getBarcodeRects(modules, moduleWidth, height);
    return {
      rects: calculatedRects,
      totalWidth: modules.length * moduleWidth,
    };
  }, [value, moduleWidth, height]);

  if (!value) {
    return (
      <div className={`text-xs text-slate-400 italic ${className}`}>
        No barcode assigned
      </div>
    );
  }

  const svgHeight = showText ? height + 18 : height;

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        width={totalWidth}
        height={svgHeight}
        viewBox={`0 0 ${totalWidth} ${svgHeight}`}
        xmlns="http://www.w3.org/2000/svg"
        className="max-w-full h-auto"
        style={{ backgroundColor: bgColor }}
        role="img"
        aria-label={`Barcode: ${value}`}
      >
        <rect width={totalWidth} height={svgHeight} fill={bgColor} />
        {rects.map((r, i) => (
          <rect
            key={i}
            x={r.x}
            y={r.y}
            width={r.width}
            height={r.height}
            fill={barColor}
          />
        ))}
        {showText && (
          <text
            x={totalWidth / 2}
            y={height + 14}
            textAnchor="middle"
            fill={textColor}
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "2.5px",
            }}
          >
            {value}
          </text>
        )}
      </svg>
    </div>
  );
}
