import React, { useEffect, useRef, useState } from 'react';

interface SheetProps {
  children: React.ReactNode;
  scale?: number; // 수동 배율
  responsive?: boolean; // 컨테이너 너비에 맞춰 자동 스케일
  origin?: 'top-left' | 'top-center'; // 스케일 기준 원점
}

const Sheet: React.FC<SheetProps> = ({ children, scale = 1.0, responsive = false, origin = 'top-left' }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [autoScale, setAutoScale] = useState(scale);

  useEffect(() => {
    if (!responsive) return;
    const ro = new ResizeObserver(() => {
      if (!wrapRef.current || !innerRef.current) return;
      const wrapW = wrapRef.current.clientWidth;
      const wrapH = wrapRef.current.clientHeight || window.innerHeight;
      const sheetRect = innerRef.current.getBoundingClientRect();
      const naturalW = (sheetRect.width / (autoScale || 1)) || sheetRect.width || 1; // 현재 스케일을 역산
      const naturalH = (sheetRect.height / (autoScale || 1)) || sheetRect.height || 1;
      const padding = 16; // 여백
      const sW = (wrapW - padding) / naturalW;
      const sH = (wrapH - padding) / naturalH;
      const s = Math.min(1, sW, sH);
      setAutoScale(Number.isFinite(s) && s > 0 ? s : 1);
    });
    ro.observe(wrapRef.current!);
    return () => ro.disconnect();
  }, [responsive]);

  // 화면에서는 responsive/수동 스케일 사용, 인쇄 시에는 1.0로 강제
  const printing = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('print').matches;
  const currentScale = printing ? 1 : (responsive ? autoScale : scale);

  const innerStyle: React.CSSProperties = {
    width: `100mm`,
    height: `148mm`,
    position: 'relative',
    background: 'white',
    border: '1px solid #ccc',
    transform: `scale(${currentScale})`,
    transformOrigin: origin === 'top-left' ? 'top left' : 'top center',
  };

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div ref={innerRef} style={innerStyle}>
        {children}
        <div className="no-print" style={{ position: 'absolute', bottom: '5mm', right: '5mm', fontSize: '10px', color: '#64748b', background: 'rgba(255,255,255,0.7)', padding: '2px 6px', borderRadius: '8px' }}>
          {Math.round(currentScale * 100)}% 실물 크기
        </div>
      </div>
    </div>
  );
};

export default Sheet;