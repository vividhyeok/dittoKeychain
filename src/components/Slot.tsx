import React, { useRef } from 'react';
import { PartSpec } from '../types';
import { useGesture } from '../utils/gesture';
import { FOUR_FIVE, CD } from '../utils/printSpecs';

interface SlotProps {
  part: PartSpec['part'];
  spec: PartSpec;
  onUpdate: (spec: PartSpec) => void;
  showGuides?: boolean; // 화면 가이드 표시 여부
  onClick?: () => void;
  isActive?: boolean;
  anchor?: 'center' | 'top-left'; // 위치 기준: 기본 center, FourUp 등에는 top-left로 정확 배치
}

const Slot: React.FC<SlotProps> = ({ part, spec, onUpdate, showGuides = true, onClick, isActive = false, anchor = 'center' }) => {
  const imageRef = useRef<HTMLDivElement>(null);

  // 이동 자유화를 위해 뷰포트 경계 계산은 제거

  // 스케일만 안전 범위로 제한하고, 이동은 자유롭게 허용 (사용자가 원하는 영역 선택 용이)
  const clampTransform = (updates: Partial<{ tx: number; ty: number; scale: number; rot: number }>) => {
    const newTx = updates.tx !== undefined ? updates.tx : spec.tx;
    const newTy = updates.ty !== undefined ? updates.ty : spec.ty;
    // 최소 배율을 1로 설정: 초기에는 전체 이미지가 보이도록(contain) 하고, 이후 확대/이동으로 영역을 선택
    const newScale = updates.scale !== undefined ? Math.max(1, Math.min(5, updates.scale)) : Math.max(1, spec.scale);
    const newRot = updates.rot !== undefined ? updates.rot : spec.rot;
    return { tx: newTx, ty: newTy, scale: newScale, rot: newRot };
  };

  useGesture(
    imageRef.current,
    (updates: Partial<{ tx: number; ty: number; scale: number; rot: number }>) => onUpdate({ ...spec, ...clampTransform(updates) }),
    spec
  );
  let trimWidth = 0, trimHeight = 0, bleedWidth = 0, bleedHeight = 0, safeWidth = 0, safeHeight = 0;
  let isCircle = false;

  if (part === 'cd-disc') {
    trimWidth = trimHeight = CD.disc.trimD; // Ø40mm
    bleedWidth = bleedHeight = CD.disc.bleedD; // Ø44mm
    safeWidth = safeHeight = CD.disc.safeD; // Ø34mm
    isCircle = true;
  } else if (part === 'case-front') {
    trimWidth = CD.caseFront.trimW;
    trimHeight = CD.caseFront.trimH;
    bleedWidth = CD.caseFront.bleedW;
    bleedHeight = CD.caseFront.bleedH;
    safeWidth = CD.caseFront.safeW;
    safeHeight = CD.caseFront.safeH;
  } else if (part === 'case-back') {
    trimWidth = CD.caseBack.trimW;
    trimHeight = CD.caseBack.trimH;
    bleedWidth = CD.caseBack.bleedW;
    bleedHeight = CD.caseBack.bleedH;
    safeWidth = CD.caseBack.safeW;
    safeHeight = CD.caseBack.safeH;
  } else if (part === '4x5-front' || part === '4x5-back') {
    trimWidth = FOUR_FIVE.trimW;
    trimHeight = FOUR_FIVE.trimH;
    bleedWidth = FOUR_FIVE.bleedW;
    bleedHeight = FOUR_FIVE.bleedH;
    safeWidth = FOUR_FIVE.viewportW;
    safeHeight = FOUR_FIVE.viewportH; // 내부 표시창
  } else if (part === 'cd-front-left') {
    trimWidth = CD.panels.front.left.w;
    trimHeight = CD.panels.front.left.h;
    bleedWidth = CD.panels.front.left.w; // 패널은 트림=블리드 동치로 취급(여백 없음)
    bleedHeight = CD.panels.front.left.h;
    safeWidth = CD.panels.front.left.w - 6; // 임의 3mm 여백
    safeHeight = CD.panels.front.left.h - 6;
  } else if (part === 'cd-front-right') {
    trimWidth = CD.panels.front.right.w;
    trimHeight = CD.panels.front.right.h;
    bleedWidth = CD.panels.front.right.w;
    bleedHeight = CD.panels.front.right.h;
    safeWidth = CD.panels.front.right.w - 6;
    safeHeight = CD.panels.front.right.h - 6;
  } else if (part === 'cd-back-outside') {
    trimWidth = CD.panels.back.outside.w;
    trimHeight = CD.panels.back.outside.h;
    bleedWidth = CD.panels.back.outside.w;
    bleedHeight = CD.panels.back.outside.h;
    safeWidth = CD.panels.back.outside.w - 6;
    safeHeight = CD.panels.back.outside.h - 6;
  } else if (part === 'cd-back-inside') {
    trimWidth = CD.panels.back.inside.w;
    trimHeight = CD.panels.back.inside.h;
    bleedWidth = CD.panels.back.inside.w;
    bleedHeight = CD.panels.back.inside.h;
    safeWidth = CD.panels.back.inside.w - 6;
    safeHeight = CD.panels.back.inside.h - 6;
  } else if (part === 'cd-spine-1' || part === 'cd-spine-2' || part === 'cd-spine-3') {
    const spine = CD.panels.back.spine1; // 모두 동일 규격
    trimWidth = spine.w;
    trimHeight = spine.h;
    bleedWidth = spine.w;
    bleedHeight = spine.h;
    safeWidth = spine.w - 2; // 1mm 여백
    safeHeight = spine.h - 2;
  }

  const slotStyle: React.CSSProperties = {
    position: 'absolute',
    ...(anchor === 'center'
      ? { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
      : { left: 0, top: 0 }),
    width: `${bleedWidth}mm`,
    height: `${bleedHeight}mm`,
    background: spec.bgColor ?? '#ffffff',
  };

  // 4x5의 내부 가시 영역(뷰포트): 35×45mm 고정
  const hasViewport = part === '4x5-front' || part === '4x5-back';
  const viewportWidth = hasViewport ? FOUR_FIVE.viewportW : trimWidth;
  const viewportHeight = hasViewport ? FOUR_FIVE.viewportH : trimHeight;
  const viewportStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: `${viewportWidth}mm`,
    height: `${viewportHeight}mm`,
    overflow: 'hidden',
    zIndex: 1,
    ...(isCircle && !hasViewport && { borderRadius: '50%' }),
  };

  const trimStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: `${trimWidth}mm`,
    height: `${trimHeight}mm`,
    border: showGuides ? '1.5px solid #C81E1E' : 'none', // 트림 가이드(짙은 빨강)
    zIndex: 3,
    pointerEvents: 'none',
    ...(isCircle && { borderRadius: '50%' }),
  };

  const safeStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: `${safeWidth}mm`,
    height: `${safeHeight}mm`,
    border: showGuides ? '1.5px dashed #1D4ED8' : 'none', // 안전 가이드(짙은 파랑)
    zIndex: 2,
    pointerEvents: 'none',
    ...(isCircle && { borderRadius: '50%' }),
  };

  const imageStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    touchAction: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#aaa',
    fontSize: 12,
    cursor: 'grab',
    userSelect: 'none',
  };

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain', // 초기에는 전체 이미지가 보이도록
    transform: `translate(${spec.tx}mm, ${spec.ty}mm) scale(${spec.scale}) rotate(${spec.rot}deg)`,
    transformOrigin: 'center',
    willChange: 'transform',
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight && (!spec.imgWidth || !spec.imgHeight)) {
      onUpdate({ ...spec, imgWidth: img.naturalWidth, imgHeight: img.naturalHeight });
    }
  };

  const centerMarkStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: '5mm',
    height: '5mm',
    display: showGuides ? 'block' : 'none',
    zIndex: 4,
  };

  return (
    <div style={slotStyle}>
      <div style={{ ...trimStyle, boxShadow: isActive ? '0 0 0 2px rgba(59,130,246,0.7) inset' : undefined }}>
        <div style={safeStyle}></div>
        {/* 뷰포트: 4x5는 35x45mm 크롭 창, 그 외는 트림 전체 */}
        <div style={viewportStyle} onClick={onClick}>
          <div ref={imageRef} style={imageStyle}>
            {spec.img ? (
              <img src={spec.img} alt="" style={imgStyle} onLoad={handleImageLoad} />
            ) : spec.bgColor ? null : (
              <span style={{ color: '#64748b' }}>이미지 또는 색상을 선택하세요</span>
            )}
          </div>
        </div>
      </div>
      {/* CD 디스크 센터홀 가이드 */}
      {part === 'cd-disc' && showGuides && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${CD.disc.holeD}mm`,
            height: `${CD.disc.holeD}mm`,
            borderRadius: '50%',
            border: '1px solid #111827', // 거의 검정에 가까운 진한 회색
            zIndex: 5,
            pointerEvents: 'none',
          }}
        />
      )}
      <svg style={centerMarkStyle} viewBox="0 0 5 5">
        <line x1="2.5" y1="0" x2="2.5" y2="5" stroke="black" strokeWidth="0.2" />
        <line x1="0" y1="2.5" x2="5" y2="2.5" stroke="black" strokeWidth="0.2" />
      </svg>
    </div>
  );
};

export default Slot;