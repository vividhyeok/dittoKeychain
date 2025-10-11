import { useRef, useEffect } from 'react';

type Updates = Partial<{ tx: number; ty: number; scale: number; rot: number }>;

export const useGesture = (
  element: HTMLElement | null,
  onUpdate: (updates: Updates) => void,
  initial: { tx: number; ty: number; scale: number; rot: number }
) => {
  const pointers = useRef<Map<number, PointerEvent>>(new Map());
  const start = useRef(initial);
  const meta = useRef({
    baseTx: initial.tx,
    baseTy: initial.ty,
    baseScale: initial.scale,
    baseRot: initial.rot,
    startDist: 0,
    startAngle: 0,
    anchorX: 0,
    anchorY: 0,
  });

  useEffect(() => {
    if (!element) return;

    const updatePointer = (e: PointerEvent) => {
      pointers.current.set(e.pointerId, e);
    };

    const handleDown = (e: PointerEvent) => {
      e.preventDefault();
      element.setPointerCapture?.(e.pointerId);
      updatePointer(e);
      // 기준값 저장
      start.current = { ...initial };
      meta.current.baseTx = initial.tx;
      meta.current.baseTy = initial.ty;
      meta.current.baseScale = initial.scale;
      meta.current.baseRot = initial.rot;
      if (pointers.current.size === 1) {
        meta.current.anchorX = e.clientX;
        meta.current.anchorY = e.clientY;
      }
      if (pointers.current.size === 2) {
        const [p1, p2] = Array.from(pointers.current.values());
        meta.current.startDist = Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY);
        meta.current.startAngle = Math.atan2(p2.clientY - p1.clientY, p2.clientX - p1.clientX);
      }
    };

    const handleMove = (e: PointerEvent) => {
      updatePointer(e);
      const pts = Array.from(pointers.current.values());
      if (pts.length === 1) {
        const dx = e.clientX - meta.current.anchorX;
        const dy = e.clientY - meta.current.anchorY;
        onUpdate({ tx: meta.current.baseTx + dx / 3.78, ty: meta.current.baseTy + dy / 3.78 });
      } else if (pts.length >= 2) {
        const [p1, p2] = pts;
        const dist = Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY);
        const scale = meta.current.startDist > 0 ? meta.current.baseScale * (dist / meta.current.startDist) : meta.current.baseScale;
        onUpdate({ scale: Math.max(0.2, Math.min(5, scale)), rot: meta.current.baseRot });
      }
    };

    const handleUpOrCancel = (e: PointerEvent) => {
      element.releasePointerCapture?.(e.pointerId);
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) {
        meta.current.startDist = 0;
      }
    };

    element.addEventListener('pointerdown', handleDown);
    element.addEventListener('pointermove', handleMove);
    element.addEventListener('pointerup', handleUpOrCancel);
    element.addEventListener('pointercancel', handleUpOrCancel);

    return () => {
      element.removeEventListener('pointerdown', handleDown);
      element.removeEventListener('pointermove', handleMove);
      element.removeEventListener('pointerup', handleUpOrCancel);
      element.removeEventListener('pointercancel', handleUpOrCancel);
    };
  }, [element, onUpdate, initial]);
};