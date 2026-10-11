export interface ScannabilityResult {
  score: number; // 0 to 100
  contrastRatio: number;
  isAcceptable: boolean; // >= 75
  recommendations: string[];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace(/^#/, "");
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function calculateScannability(
  fgColorHex: string,
  bgColorHex: string
): ScannabilityResult {
  const fg = hexToRgb(fgColorHex);
  const bg = hexToRgb(bgColorHex);

  const l1 = getRelativeLuminance(fg.r, fg.g, fg.b);
  const l2 = getRelativeLuminance(bg.r, bg.g, bg.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const contrastRatio = Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));

  const recommendations: string[] = [];

  // Scannability scoring scale (0 to 100)
  let score = 90;

  if (contrastRatio >= 7) {
    score = 98;
  } else if (contrastRatio >= 4.5) {
    score = 88;
  } else if (contrastRatio >= 3) {
    score = 72;
    recommendations.push("Moderate contrast. Increase luminance delta for older mobile camera lenses.");
  } else {
    score = Math.max(20, Math.round(contrastRatio * 20));
    recommendations.push("Low contrast alert! QR readers may fail under dim lighting conditions.");
  }

  return {
    score,
    contrastRatio,
    isAcceptable: score >= 70,
    recommendations,
  };
}
