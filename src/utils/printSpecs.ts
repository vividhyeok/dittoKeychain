// 표준 인쇄/부품 규격과 유틸

export const DPI = 300; // 기본 내보내기 해상도

export const SHEET = {
  widthMm: 100,
  heightMm: 148,
  outerMarginMm: 2, // 권장 2–3mm, 기본 2mm
};

export const GAP = {
  tileMm: 4, // 미리보기 이미지 사이 간격 +2mm (기존 2mm → 4mm)
};

export const FOUR_FIVE = {
  trimW: 40,
  trimH: 50,
  bleedW: 44,
  bleedH: 54,
  viewportW: 35,
  viewportH: 45,
};

export const CD = {
  disc: {
    trimD: 40, // Ø40
    bleedD: 44, // Ø44
    safeD: 34, // Ø34 (트림 안쪽 3mm)
    holeD: 5.5, // Ø5.5 타공
  },
  caseFront: {
    trimW: 40, trimH: 40,
    bleedW: 44, bleedH: 44,
    safeW: 34, safeH: 34,
  },
  caseBack: {
    trimW: 49, trimH: 37,
    bleedW: 53, bleedH: 41,
    safeW: 43, safeH: 31,
  },
};

export const mmToPx = (mm: number, dpi: number = DPI) => Math.round((mm / 25.4) * dpi);

// 내보내기 시 이미지가 너무 좌상단으로 느껴질 때, 미세 오프셋(우측/하단) 적용
export const EXPORT_NUDGE = {
  xMm: 1.0, // 오른쪽으로 1.0mm
  yMm: 1.0, // 아래로 1.0mm
};
