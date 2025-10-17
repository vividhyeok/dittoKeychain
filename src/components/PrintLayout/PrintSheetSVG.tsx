// components/PrintLayout/PrintSheetSVG.tsx
import { forwardRef } from 'react';
import { mmToPx } from '../../lib/mm';
import { crossPerfPaths } from '../../lib/perfPath';
import { Config } from '../../types/config';

type Props = { cfg: Config; side: 'front' | 'back' };

const PrintSheetSVG = forwardRef<SVGSVGElement, Props>(({ cfg, side }, ref) => {
  const { page, grid } = cfg.print;
  const pxW = mmToPx(page.w_mm), pxH = mmToPx(page.h_mm);
  const margin = mmToPx(page.margin_mm);
  const d = cfg.part.outer_diameter_mm;
  const r = d / 2;
  const bleed = cfg.part.bleed_mm ?? cfg.defaults.bleed_mm;
  const safe = cfg.part.safe_mm ?? cfg.defaults.safe_mm;

  const cellW = mmToPx(d + grid.spacing_mm + bleed * 2);
  const cellH = cellW;

  const items = [] as JSX.Element[];
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const cx = margin + col * cellW + mmToPx(d / 2 + bleed);
      const cy = margin + row * cellH + mmToPx(d / 2 + bleed);

      const Router = mmToPx(r + bleed);
      const Rsafe = mmToPx(r - safe);
      const [hRect, vRect] = crossPerfPaths(cx, cy,
        mmToPx(cfg.part.perforation.half_arm_mm),
        mmToPx(cfg.part.perforation.arm_width_mm)
      );

      const imageCfg = side === 'front' ? cfg.part.images.front : cfg.part.images.back;
      const imageSrc = imageCfg.src;
      const flipX = side === 'back' && cfg.part.images.back.flipXOnBack;
      const fit = imageCfg.fit ?? cfg.defaults.fit ?? 'cover';
      const preserveAspectRatio = fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet';

      items.push(
        <g key={`${row}-${col}`}>
          {/* 이미지 클립패스 */}
          <defs>
            <clipPath id={`clip-${row}-${col}`}>
              <circle cx={cx} cy={cy} r={mmToPx(r)} />
            </clipPath>
          </defs>
          <image
            href={imageSrc}
            x={cx - mmToPx(r)}
            y={cy - mmToPx(r)}
            width={mmToPx(d)}
            height={mmToPx(d)}
            clipPath={`url(#clip-${row}-${col})`}
            transform={flipX ? `scale(-1,1) translate(${-2 * cx},0)` : undefined}
            preserveAspectRatio={preserveAspectRatio}
          />
          {/* 외곽 재단선 */}
          {cfg.print.show_cut_lines && (
            <circle cx={cx} cy={cy} r={Router} fill="none" stroke="black" strokeWidth={1} />
          )}
          {/* 안전선(옵션) */}
          {cfg.print.show_safe_bleed && (
            <circle cx={cx} cy={cy} r={Rsafe} fill="none" stroke="gray" strokeDasharray="4 4" />
          )}
          {/* 십자 퍼포레이션(점선) */}
          <path d={hRect} fill="none" stroke="black"
                strokeWidth={mmToPx(0.2)} strokeDasharray={`${mmToPx(cfg.part.perforation.dash_mm)} ${mmToPx(cfg.part.perforation.gap_mm)}`} />
          <path d={vRect} fill="none" stroke="black"
                strokeWidth={mmToPx(0.2)} strokeDasharray={`${mmToPx(cfg.part.perforation.dash_mm)} ${mmToPx(cfg.part.perforation.gap_mm)}`} />
        </g>
      );
    }
  }

  // 등록표식(크로스헤어) 유틸
  const regMarks: JSX.Element[] = [];
  if (cfg.print.registration_marks) {
    const cross = (x: number, y: number, sizeMm = 4, color = '#000') => {
      const half = mmToPx(sizeMm) / 2;
      const sw = 1; // 1px 선
      return (
        <g key={`reg-${x}-${y}`} stroke={color} strokeWidth={sw}>
          <line x1={x - half} y1={y} x2={x + half} y2={y} />
          <line x1={x} y1={y - half} x2={x} y2={y + half} />
        </g>
      );
    };
    const inset = mmToPx(5); // 여백에서 5mm 안쪽
    regMarks.push(
      cross(inset, inset),
      cross(pxW - inset, inset),
      cross(inset, pxH - inset),
      cross(pxW - inset, pxH - inset),
      cross(pxW / 2, pxH / 2, 6, '#666') // 중앙 회색
    );
  }

  return (
    <svg ref={ref} width={pxW} height={pxH} viewBox={`0 0 ${pxW} ${pxH}`}>
      {regMarks}
      {items}
    </svg>
  );
});

PrintSheetSVG.displayName = 'PrintSheetSVG';

export default PrintSheetSVG;