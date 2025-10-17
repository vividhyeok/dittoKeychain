import { forwardRef } from 'react';
import { CD, mmToPx } from '../../utils/printSpecs';
import type { PartSpec } from '../../types';

type Props = {
  specs: Record<string, PartSpec>;
  showGuides?: boolean; // 기본 true: 접는 점선 등 표시
};

const BackFoldStrip = forwardRef<SVGSVGElement, Props>(({ specs, showGuides = true }, ref) => {
  const panels = [
    { key: 'cd-back-outside', w: CD.panels.back.outside.w, h: CD.panels.back.outside.h, label: 'outside' },
    { key: 'cd-spine-1', w: CD.panels.back.spine1.w, h: CD.panels.back.spine1.h, label: 'spine 1' },
    { key: 'cd-spine-2', w: CD.panels.back.spine2.w, h: CD.panels.back.spine2.h, label: 'spine 2' },
    { key: 'cd-spine-3', w: CD.panels.back.spine3.w, h: CD.panels.back.spine3.h, label: 'spine 3' },
    { key: 'cd-back-inside', w: CD.panels.back.inside.w, h: CD.panels.back.inside.h, label: 'inside' },
  ] as const;

  const totalWmm = panels.reduce((acc, p) => acc + p.w, 0);
  const Hmm = CD.panels.back.outside.h; // 모두 높이 37mm 기준
  const Wpx = mmToPx(totalWmm);
  const Hpx = mmToPx(Hmm);

  // 누적 X 좌표 테이블
  const offsets: number[] = [];
  panels.reduce((acc, p, i) => {
    offsets[i] = acc;
    return acc + p.w;
  }, 0);

  return (
    <svg ref={ref} width={Wpx} height={Hpx} viewBox={`0 0 ${Wpx} ${Hpx}`}>
      <defs>
        {panels.map((p, i) => {
          const x = mmToPx(offsets[i]);
          const w = mmToPx(p.w);
          const h = mmToPx(p.h);
          return (
            <clipPath id={`clip-${p.key}`} key={`cp-${p.key}`}>
              <rect x={x} y={0} width={w} height={h} rx={0} ry={0} />
            </clipPath>
          );
        })}
      </defs>

      {panels.map((p, i) => {
        const x = mmToPx(offsets[i]);
        const w = mmToPx(p.w);
        const h = mmToPx(p.h);
        const spec = specs[p.key] as PartSpec | undefined;
        const img = spec?.img;
        return (
          <g key={p.key}>
            {/* 패널 배경 틀 */}
            <rect x={x} y={0} width={w} height={h} fill="#fff" stroke="#cbd5e1" />
            {/* 이미지: cover 방식 중앙 크롭 */}
            {img && (
              <image
                href={img}
                x={x}
                y={0}
                width={w}
                height={h}
                preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#clip-${p.key})`}
              />
            )}
            {/* 라벨(미리보기용) */}
            <text x={x + 6} y={16} fill="#64748b" fontSize={12}>
              {p.label}
            </text>
          </g>
        );
      })}

      {/* 접는 선: 패널 경계선 점선 */}
      {showGuides && (
        <g stroke="#94a3b8" strokeWidth={1} strokeDasharray="6 6">
          {panels.map((_, i) => {
            if (i === 0) return null; // 첫 패널 앞에는 경계 없음
            const x = mmToPx(offsets[i]);
            return <line key={`fold-${i}`} x1={x} y1={0} x2={x} y2={Hpx} />;
          })}
        </g>
      )}
    </svg>
  );
});

BackFoldStrip.displayName = 'BackFoldStrip';

export default BackFoldStrip;
