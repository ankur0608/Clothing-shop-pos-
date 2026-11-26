// Official Code 128 (Subset B) Barcode Generator & Renderer
// Pure TypeScript - Zero external dependencies - Standard ISO/IEC 15417 compliant

// Code 128 patterns (widths of 6 alternate bars and spaces, stop char has 7)
const CODE128_PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"                                // 100-106
];

const START_CODE_B = 104;
const STOP_CODE = 106;

/**
 * Encodes an ASCII string into an array of modules (1 for bar, 0 for space)
 * using standard Code 128 Subset B.
 */
export function encodeCode128B(text: string): number[] {
  if (!text) return [];

  // Filter out characters outside ASCII 32 to 126
  const cleanText = text.replace(/[^\x20-\x7E]/g, "");
  if (cleanText.length === 0) return [];

  const charCodes: number[] = [START_CODE_B];
  let checkSum = START_CODE_B;

  for (let i = 0; i < cleanText.length; i++) {
    const code = cleanText.charCodeAt(i) - 32; // Code 128B maps ASCII 32..126 to 0..94
    charCodes.push(code);
    checkSum += code * (i + 1);
  }

  const checkDigit = checkSum % 103;
  charCodes.push(checkDigit);
  charCodes.push(STOP_CODE);

  // Convert pattern digits to 1s and 0s
  const modules: number[] = [];

  // Add initial quiet zone (10 modules of space)
  for (let q = 0; q < 10; q++) modules.push(0);

  for (const code of charCodes) {
    const pattern = CODE128_PATTERNS[code];
    if (!pattern) continue;

    let isBar = true;
    for (let p = 0; p < pattern.length; p++) {
      const width = parseInt(pattern[p], 10);
      for (let w = 0; w < width; w++) {
        modules.push(isBar ? 1 : 0);
      }
      isBar = !isBar;
    }
  }

  // Trailing quiet zone (10 modules of space)
  for (let q = 0; q < 10; q++) modules.push(0);

  return modules;
}

/**
 * Generate a random scannable retail barcode (12 digits with 890 Indian retail or generic prefix)
 */
export function generateRetailBarcode(prefix = "890"): string {
  // Generate 9 random digits
  let randomPart = "";
  for (let i = 0; i < 9; i++) {
    randomPart += Math.floor(Math.random() * 10).toString();
  }
  return `${prefix}${randomPart}`;
}

/**
 * Generate a smart clothing SKU based on Category, Name, Color, Size
 */
export function generateSmartSku(
  category: string,
  name: string,
  color?: string,
  size?: string
): string {
  const cat = (category || "GEN").slice(0, 3).toUpperCase();
  const nameClean = (name || "PROD")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 4)
    .toUpperCase();
  const col = color ? color.slice(0, 3).toUpperCase() : "";
  const sz = size ? size.toUpperCase() : "";
  const rand = Math.floor(100 + Math.random() * 900);

  const parts = [cat, nameClean];
  if (col) parts.push(col);
  if (sz) parts.push(sz);
  parts.push(rand.toString());

  return parts.join("-");
}

export interface BarcodeRenderOptions {
  height?: number;
  moduleWidth?: number;
  showText?: boolean;
  fontSize?: number;
  color?: string;
  bgColor?: string;
  className?: string;
}

/**
 * Generates an SVG path data string or rect coordinates from binary modules.
 */
export function getBarcodeRects(
  modules: number[],
  moduleWidth = 2,
  height = 50
): { x: number; y: number; width: number; height: number }[] {
  const rects: { x: number; y: number; width: number; height: number }[] = [];
  let currentStart = -1;

  for (let i = 0; i < modules.length; i++) {
    if (modules[i] === 1) {
      if (currentStart === -1) currentStart = i;
    } else {
      if (currentStart !== -1) {
        rects.push({
          x: currentStart * moduleWidth,
          y: 0,
          width: (i - currentStart) * moduleWidth,
          height,
        });
        currentStart = -1;
      }
    }
  }

  if (currentStart !== -1) {
    rects.push({
      x: currentStart * moduleWidth,
      y: 0,
      width: (modules.length - currentStart) * moduleWidth,
      height,
    });
  }

  return rects;
}
