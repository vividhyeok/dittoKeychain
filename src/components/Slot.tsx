import React, { useRef } from 'react';
import { PartSpec } from '../types';
import { useGesture } from '../utils/gesture';

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
    trimWidth = trimHeight = 40; // Ø40mm
    bleedWidth = bleedHeight = 44; // Ø44mm
    safeWidth = safeHeight = 34; // Ø34mm (안전 3mm)
    isCircle = true;
  } else if (part === 'case-front') {
    trimWidth = trimHeight = 40;
    bleedWidth = bleedHeight = 44;
    safeWidth = safeHeight = 34;
  } else if (part === 'case-back') {
    trimWidth = 49;
    trimHeight = 37;
    bleedWidth = 53;
    bleedHeight = 41;
    safeWidth = 43;
    safeHeight = 31;
  } else if (part === '4x5-front' || part === '4x5-back') {
    trimWidth = 40;
    trimHeight = 50;
    bleedWidth = 44;
    bleedHeight = 54;
    safeWidth = 35;
    safeHeight = 45; // 내부 표시창
  }

  const slotStyle: React.CSSProperties = {
    position: 'absolute',
    ...(anchor === 'center'
      ? { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
      : { left: 0, top: 0 }),
    width: `${bleedWidth}mm`,
    height: `${bleedHeight}mm`,
    background: 'white', // 블리드 흰색
  };

  // 4x5의 내부 가시 영역(뷰포트): 35×45mm 고정
  const hasViewport = part === '4x5-front' || part === '4x5-back';
  const viewportWidth = hasViewport ? 35 : trimWidth;
  const viewportHeight = hasViewport ? 45 : trimHeight;
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
            ) : (
              <span>이미지 URL을 입력하세요</span>
            )}
          </div>
        </div>
      </div>
      <svg style={centerMarkStyle} viewBox="0 0 5 5">
        <line x1="2.5" y1="0" x2="2.5" y2="5" stroke="black" strokeWidth="0.2" />
        <line x1="0" y1="2.5" x2="5" y2="2.5" stroke="black" strokeWidth="0.2" />
      </svg>
    </div>
  );
};

export default Slot;