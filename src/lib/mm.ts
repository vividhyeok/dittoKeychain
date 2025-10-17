// lib/mm.ts
export const DPI = 300; // 인쇄용 DPI
export const mmToPx = (mm: number, dpi = DPI) => (mm / 25.4) * dpi;