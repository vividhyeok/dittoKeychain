import React, { useRef, useState } from 'react';
import { PartSpec } from '../types';
import { CD } from '../utils/printSpecs';

type Mode = 'front' | 'back' | 'disc';

type Preview3DProps = {
  specs: Record<string, PartSpec>;
  onClose: () => void;
};

// CSS 3D 기반의 가벼운 미리보기(드래그 회전)
const Preview3D: React.FC<Preview3DProps> = ({ specs, onClose }) => {
  const [mode, setMode] = useState<Mode>('front');
  const [rotX, setRotX] = useState(-10);
  const [rotY, setRotY] = useState(15);
  const dragging = useRef(false);
  const last = useRef<{x:number;y:number}>({x:0,y:0});
  const accumDx = useRef(0);

  const handlePointerDown: React.PointerEventHandler = (e) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragging.current = true; last.current = { x: e.clientX, y: e.clientY }; accumDx.current = 0;
  };
  const handlePointerMove: React.PointerEventHandler = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    accumDx.current += dx;
    setRotY((v) => Math.max(-120, Math.min(120, v + dx * 0.4)));
    setRotX((v) => Math.max(-60, Math.min(60, v - dy * 0.3)));
  };
  const handlePointerUp: React.PointerEventHandler = () => {
    dragging.current = false;
    const threshold = 120; // 좌우 스와이프 전환 임계값(px)
    if (accumDx.current > threshold) switchMode(-1);
    else if (accumDx.current < -threshold) switchMode(1);
    accumDx.current = 0;
  };

  const switchMode = (dir: -1 | 1) => {
    const order: Mode[] = ['front', 'back', 'disc'];
    const idx = order.indexOf(mode);
    const next = (idx + dir + order.length) % order.length;
    setMode(order[next]);
  };

  const styleImg = (url?: string): React.CSSProperties => ({
    backgroundImage: url ? `url(${url})` : 'none',
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#fff',
  });

  // 패널 이미지 매핑
  const frontLeft = specs['cd-front-left']?.img;
  const frontRight = specs['cd-front-right']?.img;
  const backOutside = specs['cd-back-outside']?.img;
  const spine1 = specs['cd-spine-1']?.img;
  const spine2 = specs['cd-spine-2']?.img;
  const spine3 = specs['cd-spine-3']?.img;
  const backInside = specs['cd-back-inside']?.img;
  const disc = specs['cd-disc']?.img;

  // mm를 CSS mm로 직접 사용(미리보기: 비례만 맞추면 충분)
  const mm = (v: number) => `${v}mm`;

  return (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white text-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] p-3 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="inline-flex gap-1 bg-slate-100 rounded-lg p-1">
            <button className={`px-3 py-1 rounded ${mode==='front'?'bg-white shadow':''}`} onClick={()=>setMode('front')}>앞면</button>
            <button className={`px-3 py-1 rounded ${mode==='back'?'bg-white shadow':''}`} onClick={()=>setMode('back')}>뒷면</button>
            <button className={`px-3 py-1 rounded ${mode==='disc'?'bg-white shadow':''}`} onClick={()=>setMode('disc')}>CD</button>
          </div>
          <button className="btn btn-outline" onClick={onClose}>닫기</button>
        </div>

        <div
          className="relative flex-1 bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl overflow-hidden touch-pan-y"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* 좌/우 전환 버튼 */}
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 btn btn-outline"
            onClick={() => switchMode(-1)}
            aria-label="이전"
          >◀</button>
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-outline"
            onClick={() => switchMode(1)}
            aria-label="다음"
          >▶</button>
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              transformStyle: 'preserve-3d',
              transform: `translate(-50%, -50%) perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
              transition: dragging.current ? 'none' : 'transform 120ms ease-out',
            }}
          >
            {mode === 'front' && (
              <div style={{ position: 'relative', width: mm(90), height: mm(50) }}>
                <div style={{ position: 'absolute', left: 0, top: mm(5), width: mm(40), height: mm(40), boxShadow: '0 6px 14px rgba(0,0,0,0.12)', borderRadius: 8, ...styleImg(frontLeft) }} />
                <div style={{ position: 'absolute', left: mm(46), top: mm(5), width: mm(40), height: mm(40), boxShadow: '0 6px 14px rgba(0,0,0,0.12)', borderRadius: 8, ...styleImg(frontRight) }} />
              </div>
            )}

            {mode === 'back' && (
              <div style={{ position: 'relative', width: mm(120), height: mm(50) }}>
                {/* 바깥 49 */}
                <div style={{ position: 'absolute', left: 0, top: mm(6.5), width: mm(49), height: mm(37), boxShadow: '0 6px 14px rgba(0,0,0,0.12)', borderRadius: 6, ...styleImg(backOutside) }} />
                {/* 옆면 0.5×3 */}
                <div style={{ position: 'absolute', left: mm(51), top: mm(6.5), width: mm(5), height: mm(37), boxShadow: '0 6px 14px rgba(0,0,0,0.10)', borderRadius: 4, ...styleImg(spine1) }} />
                <div style={{ position: 'absolute', left: mm(57), top: mm(6.5), width: mm(5), height: mm(37), boxShadow: '0 6px 14px rgba(0,0,0,0.10)', borderRadius: 4, ...styleImg(spine2) }} />
                <div style={{ position: 'absolute', left: mm(63), top: mm(6.5), width: mm(5), height: mm(37), boxShadow: '0 6px 14px rgba(0,0,0,0.10)', borderRadius: 4, ...styleImg(spine3) }} />
                {/* 안쪽 44 */}
                <div style={{ position: 'absolute', left: mm(71), top: mm(6.5), width: mm(44), height: mm(37), boxShadow: '0 6px 14px rgba(0,0,0,0.12)', borderRadius: 6, ...styleImg(backInside) }} />
              </div>
            )}

            {mode === 'disc' && (
              <div style={{ position: 'relative', width: mm(80), height: mm(80) }}>
                <div style={{ position: 'absolute', left: mm(20), top: mm(20), width: mm(40), height: mm(40), borderRadius: '50%', boxShadow: '0 6px 14px rgba(0,0,0,0.12)', ...styleImg(disc) }}>
                  <div style={{ position: 'absolute', left: '50%', top: '50%', width: mm(CD.disc.holeD), height: mm(CD.disc.holeD), borderRadius: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(255,255,255,0.92)' }} />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500">드래그로 회전 · 좌/우 스와이프로 앞/뒤/CD 전환 · Esc/닫기</div>
      </div>
    </div>
  );
};

export default Preview3D;
