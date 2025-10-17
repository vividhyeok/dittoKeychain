import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import Slot from './Slot';
import { useImageEditor, useClipboardPaste } from '../hooks/useImageEditor';
import { useIsMobile } from '../hooks/useIsMobile';
import { PartSpec } from '../types';
import { encodePayload } from '../utils/encode';
import { FOUR_FIVE, CD } from '../utils/printSpecs';

export type ImageEditorHandle = {
  generateQR: () => Promise<void>;
};

interface ImageEditorProps {
  template: '4x5' | 'cd3';
  initialSpecs: Record<string, PartSpec>;
  qrPayload: (specs: Record<string, PartSpec>) => any;
  onSpecsChange?: (specs: Record<string, PartSpec>) => void;
}
  type ControlItem = {
    key: string;
    icon: string;
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };

// URL 입력 모달 (http/https 이미지 주소만 허용)
const UrlPasteModal: React.FC<{ onClose: () => void; onSubmit: (url: string) => void; }> = ({ onClose, onSubmit }) => {
  const [value, setValue] = useState('');
  const [err, setErr] = useState('');
  const submit = () => {
    const v = value.trim();
    if (!/^https?:\/\//i.test(v)) { setErr('http(s) 이미지 주소를 입력해 주세요.'); return; }
    onSubmit(v);
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm bg-white text-slate-800 rounded-2xl shadow-lg p-4">
        <div className="text-base font-semibold mb-2">이미지 주소 입력</div>
        <input
          autoFocus
          value={value}
          onChange={(e) => { setValue(e.target.value); setErr(''); }}
          placeholder="https://example.com/image.jpg"
          className="w-full border rounded px-3 py-2"
        />
        {err && <div className="text-xs text-red-600 mt-1">{err}</div>}
        <div className="mt-3 flex justify-end gap-2">
          <button className="btn btn-outline px-3 py-1.5" onClick={onClose}>닫기</button>
          <button className="btn btn-primary px-3 py-1.5" onClick={submit}>적용</button>
        </div>
      </div>
    </div>
  );
};

const ImageEditor = React.forwardRef<ImageEditorHandle, ImageEditorProps>(({ template, initialSpecs, qrPayload, onSpecsChange }, ref) => {
  const isMobile = useIsMobile();
  const { specs, active, setActive, updateSpec, undo, redo, nudge, zoom, pasteRef } = useImageEditor(initialSpecs);
  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [clipboardMessage, setClipboardMessage] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [controlPanel, setControlPanel] = useState<'root' | 'view' | 'image' | 'input' | 'history'>('root');
  const [viewerZoom, setViewerZoom] = useState(1);

  const generateQR = useCallback(async () => {
    setLoading(true);
    try {
      // 1차 시도: 현재 스펙 그대로
      const makeUrl = (specsArg: typeof specs) => {
        const payload = qrPayload(specsArg);
        const data = encodePayload(payload);
        const editPath = template === '4x5' ? '/p/4x5/edit' : '/p/cd/edit';
        return `${window.location.origin}${editPath}?data=${data}`;
      };

      let url = makeUrl(specs);
      let qr = await QRCode.toDataURL(url, { errorCorrectionLevel: 'L' });
      setQrUrl(qr);
      setShowQrModal(true);
    } catch (e) {
      console.warn('QR 1차 생성 실패, 압축 후 재시도:', e);
      try {
        // 2~4차 시도: 이미지 축소/압축 단계적으로 적용
        const attempts: Array<{ max: number; quality: number }> = [
          { max: 640, quality: 0.7 },
          { max: 480, quality: 0.55 },
          { max: 320, quality: 0.4 },
        ];

        const compressDataUrl = async (dataUrl: string, maxDim: number, quality: number) => {
          if (!dataUrl.startsWith('data:')) return dataUrl;
          const img = new Image();
          img.src = dataUrl;
          await new Promise((res, rej) => { img.onload = () => res(null); img.onerror = rej; });
          const { width, height } = img;
          const scale = Math.min(1, maxDim / Math.max(width, height));
          const w = Math.max(1, Math.round(width * scale));
          const h = Math.max(1, Math.round(height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return dataUrl;
          ctx.drawImage(img, 0, 0, w, h);
          // webp 우선, 지원 안 하면 png로 폴백
          try {
            const out = canvas.toDataURL('image/webp', quality);
            if (out && out.length < dataUrl.length) return out;
          } catch {}
          const outPng = canvas.toDataURL('image/png');
          return outPng && outPng.length < dataUrl.length ? outPng : dataUrl;
        };

        const tryWithCompressed = async (maxDim: number, quality: number) => {
          const newSpecs: typeof specs = Object.fromEntries(
            Object.entries(specs).map(([k, s]) => [
              k,
              s.img && s.img.startsWith('data:')
                ? { ...s, img: s.img }
                : s,
            ])
          ) as any;

          // dataURL인 이미지들만 압축 적용
          for (const key of Object.keys(newSpecs)) {
            const s = newSpecs[key];
            if (s.img && s.img.startsWith('data:')) {
              try { newSpecs[key] = { ...s, img: await compressDataUrl(s.img, maxDim, quality) }; } catch {}
            }
          }
          const payloadUrl = (() => {
            const payload = qrPayload(newSpecs);
            const data = encodePayload(payload);
            const editPath = template === '4x5' ? '/p/4x5/edit' : '/p/cd/edit';
            return `${window.location.origin}${editPath}?data=${data}`;
          })();
          const qr = await QRCode.toDataURL(payloadUrl, { errorCorrectionLevel: 'L' });
          return qr;
        };

        let qr: string | null = null;
        for (const a of attempts) {
          try {
            qr = await tryWithCompressed(a.max, a.quality);
            if (qr) break;
          } catch (err) {
            console.warn('압축 단계 실패:', err);
          }
        }
        if (!qr) throw new Error('모든 압축 시도 실패');
        setQrUrl(qr);
        setShowQrModal(true);
      } catch (e2) {
        console.error('QR 생성 실패(최종):', e2);
      }
    } finally {
      setLoading(false);
    }
  }, [qrPayload, specs, template]);

  // 외부에서 완료(생성) 트리거를 호출할 수 있도록 노출
  useImperativeHandle(ref, () => ({ generateQR }), [generateQR]);

  useEffect(() => {
    const handleDone = () => { void generateQR(); };
    window.addEventListener('editor:done', handleDone);
    return () => window.removeEventListener('editor:done', handleDone);
  }, [generateQR]);

  // 스펙 변화 콜백(상위에서 3D 프리뷰 등 동기화에 사용)
  useEffect(() => { onSpecsChange?.(specs); }, [specs, onSpecsChange]);

  const handlePaste = useCallback((dataUrl: string) => {
    // 초기에는 이미지 전체가 보이도록(scale 최소 1) 설정
    updateSpec(active, s => ({ ...s, img: dataUrl, tx: 0, ty: 0, scale: Math.max(1, s.scale || 1) }));
    setClipboardMessage('이미지를 불러왔어요.');
  }, [active, updateSpec]);

  const { handlePasteEvent, readClipboard } = useClipboardPaste(handlePaste, (message) => console.warn(message));

  const tryReadClipboard = useCallback(async () => {
    setClipboardMessage('클립보드를 확인 중이에요...');
    try {
      await readClipboard();
    } catch (err) {
      console.warn('클립보드 읽기 실패:', err);
    }
  }, [readClipboard]);

  const adjustViewerZoom = useCallback((direction: 1 | -1) => {
    setViewerZoom(prev => {
      const factor = direction === 1 ? 1.12 : 1 / 1.12;
      const next = prev * factor;
      return Math.min(3, Math.max(0.5, Number(next.toFixed(3))));
    });
  }, []);

  const resetViewerZoom = useCallback(() => {
    setViewerZoom(1);
  }, []);

  // 키보드 단축키 (이동 방향 반전)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          redo();
        }
      } else {
        switch (e.key) {
          case 'ArrowUp': nudge(0, 1); break;      // 반전
          case 'ArrowDown': nudge(0, -1); break;    // 반전
          case 'ArrowLeft': nudge(1, 0); break;     // 반전
          case 'ArrowRight': nudge(-1, 0); break;   // 반전
          case '+': case '=': zoom(1); break;
          case '-': zoom(-1); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nudge, zoom, undo, redo]);

  // 뷰포트 mm 크기 조회(커버 스케일 계산에 사용)
  const getViewportMm = (part: PartSpec['part']): { w: number; h: number } => {
    if (part === '4x5-front' || part === '4x5-back') return { w: FOUR_FIVE.viewportW, h: FOUR_FIVE.viewportH };
    if (part === 'cd-disc') return { w: CD.disc.trimD, h: CD.disc.trimD };
    if (part === 'cd-front-left') return { w: CD.panels.front.left.w, h: CD.panels.front.left.h };
    if (part === 'cd-front-right') return { w: CD.panels.front.right.w, h: CD.panels.front.right.h };
    if (part === 'cd-back-outside') return { w: CD.panels.back.outside.w, h: CD.panels.back.outside.h };
    if (part === 'cd-back-inside') return { w: CD.panels.back.inside.w, h: CD.panels.back.inside.h };
    if (part === 'cd-spine-1' || part === 'cd-spine-2' || part === 'cd-spine-3') return { w: CD.panels.back.spine1.w, h: CD.panels.back.spine1.h };
    // 기본값: 사각 40x40
    return { w: 40, h: 40 };
  };

  const coverCurrent = useCallback(() => {
    const s = specs[active];
    if (!s) return;
    const { w: cw, h: ch } = getViewportMm(s.part);
    const iw = s.imgWidth || 0;
    const ih = s.imgHeight || 0;
    if (!iw || !ih) return; // 이미지 크기 미확인 시 스킵
    const aspectI = iw / ih;
    const aspectC = cw / ch;
    const factor = Math.max(aspectC / aspectI, aspectI / aspectC); // contain(=1) 대비 커버 배율
    updateSpec(active, (prev) => ({ ...prev, tx: 0, ty: 0, scale: Math.min(5, Math.max(1, (prev.scale || 1) * factor)) }));
  }, [active, specs, updateSpec]);

  const resetCurrent = useCallback(() => {
    updateSpec(active, (prev) => ({ ...prev, tx: 0, ty: 0, scale: 1, rot: 0 }));
  }, [active, updateSpec]);

  const PREVIEW_GAP_MM = 2;

  const groups = useMemo(() => {
    if (template === 'cd3') {
      return [
        { key: 'front', label: '앞', parts: ['cd-front-left', 'cd-front-right'] as string[] },
        { key: 'back', label: '뒤', parts: ['cd-back-outside', 'cd-spine-1', 'cd-spine-2', 'cd-spine-3', 'cd-back-inside'] as string[] },
        { key: 'disc', label: 'CD', parts: ['cd-disc'] as string[] },
      ]
        .map(group => ({ ...group, parts: group.parts.filter(part => specs[part]) }))
        .filter(group => group.parts.length > 0);
    }
    if (template === '4x5') {
      return [
        { key: 'front', label: '앞', parts: ['4x5-front'] as string[] },
        { key: 'back', label: '뒤', parts: ['4x5-back'] as string[] },
      ]
        .map(group => ({ ...group, parts: group.parts.filter(part => specs[part]) }))
        .filter(group => group.parts.length > 0);
    }
    return [];
  }, [template, specs]);

  const activeGroup = useMemo(() => {
    if (!groups.length) return undefined;
    return groups.find(group => group.parts.includes(active)) ?? groups[0];
  }, [groups, active]);

  const selectGroup = useCallback((groupKey: string) => {
    const group = groups.find(g => g.key === groupKey);
    if (!group) return;
    const next = group.parts.includes(active) ? active : group.parts[0];
    if (next) setActive(next);
  }, [groups, active, setActive]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ group?: string }>).detail;
      if (!detail?.group) return;
      selectGroup(detail.group);
    };
    window.addEventListener('editor:group', handler as EventListener);
    return () => window.removeEventListener('editor:group', handler as EventListener);
  }, [selectGroup]);

  useEffect(() => {
    if (!activeGroup) return;
    window.dispatchEvent(new CustomEvent('editor:group-changed', { detail: { group: activeGroup.key } }));
  }, [activeGroup]);

  const stageWrapperRef = useRef<HTMLDivElement>(null);
  const stageInnerRef = useRef<HTMLDivElement>(null);
  const stageTransformRef = useRef<HTMLDivElement>(null);
  const [stageScale, setStageScale] = useState(1);

  useEffect(() => {
    const wrapper = stageWrapperRef.current;
    const inner = stageInnerRef.current;
    if (!wrapper || !inner) return;

    const computeScale = () => {
      const wrapperRect = wrapper.getBoundingClientRect();
      const innerRect = inner.getBoundingClientRect();
      if (!wrapperRect.width || !innerRect.width || !wrapperRect.height || !innerRect.height) {
        setStageScale(1);
        return;
      }
      const paddingX = isMobile ? 64 : 120;
      const paddingY = isMobile ? 80 : 160;
      const availableW = Math.max(80, wrapperRect.width - paddingX);
      const availableH = Math.max(80, wrapperRect.height - paddingY);
      const scale = Math.min(
        availableW / innerRect.width,
        availableH / innerRect.height,
        2.4,
      );
      setStageScale(scale > 0 && Number.isFinite(scale) ? Math.max(scale, 0.25) : 1);
    };

    const ro = new ResizeObserver(() => computeScale());
    ro.observe(wrapper);
    ro.observe(inner);
    computeScale();
    return () => ro.disconnect();
  }, [activeGroup, specs, isMobile]);

  const activatePart = useCallback((partKey: string) => {
    setActive(partKey);
    pasteRef.current?.focus();
    if (!isMobile) {
      tryReadClipboard();
    }
  }, [isMobile, pasteRef, setActive, tryReadClipboard]);

  const renderSlotAt = useCallback((partKey: string, offsetX: number, offsetY = 0, options?: { showGuides?: boolean }) => {
    const spec = specs[partKey];
    if (!spec) return null;
    return (
      <div
        key={partKey}
        style={{ position: 'absolute', left: `${offsetX}mm`, top: `${offsetY}mm` }}
      >
        <Slot
          anchor="top-left"
          part={spec.part}
          spec={spec}
          showGuides={options?.showGuides ?? true}
          onUpdate={(s) => updateSpec(partKey, () => s)}
          onClick={() => activatePart(partKey)}
          isActive={active === partKey}
        />
      </div>
    );
  }, [activatePart, specs, updateSpec, active]);

  const preview = useMemo(() => {
    if (!activeGroup) return null;

    const plate = (widthMm: number, heightMm: number) => (
      <div
        key="plate"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${widthMm}mm`,
          height: `${heightMm}mm`,
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid rgba(148, 163, 184, 0.55)',
          boxShadow: '0 22px 50px rgba(15, 23, 42, 0.35)',
        }}
      />
    );

    if (template === 'cd3') {
      if (activeGroup.key === 'front') {
        const widthMm = CD.panels.front.left.w + PREVIEW_GAP_MM + CD.panels.front.right.w;
        const heightMm = CD.panels.front.left.h;
        return {
          title: '앞 커버',
          widthMm,
          heightMm,
          nodes: (
            <>
              {plate(widthMm, heightMm)}
              {renderSlotAt('cd-front-left', 0, 0)}
              {renderSlotAt('cd-front-right', CD.panels.front.left.w + PREVIEW_GAP_MM, 0)}
            </>
          ),
        };
      }
      if (activeGroup.key === 'back') {
        const sequence: Array<{ key: string; w: number }> = [
          { key: 'cd-back-outside', w: CD.panels.back.outside.w },
          { key: 'cd-spine-1', w: CD.panels.back.spine1.w },
          { key: 'cd-spine-2', w: CD.panels.back.spine2.w },
          { key: 'cd-spine-3', w: CD.panels.back.spine3.w },
          { key: 'cd-back-inside', w: CD.panels.back.inside.w },
        ];
        const heightMm = CD.panels.back.outside.h;
        const widthMm = sequence.reduce((acc, cur, idx) => acc + cur.w + (idx === 0 ? 0 : PREVIEW_GAP_MM), 0);
        const sequenceWithOffsets: Array<{ key: string; w: number; start: number }> = [];
        let running = 0;
        sequence.forEach((item, idx) => {
          if (idx > 0) running += PREVIEW_GAP_MM;
          sequenceWithOffsets.push({ ...item, start: running });
          running += item.w;
        });
        const showGroupGuides = true;
        const safeInsetMm = 3;
        const safeWidthMm = Math.max(0, widthMm - safeInsetMm * 2);
        const safeHeightMm = Math.max(0, heightMm - safeInsetMm * 2);
        return {
          title: '뒷 커버 + 옆면',
          widthMm,
          heightMm,
          nodes: (
            <>
              {plate(widthMm, heightMm)}
              {showGroupGuides && (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: `${widthMm}mm`,
                      height: `${heightMm}mm`,
                      border: '1.5px solid #C81E1E',
                      borderRadius: 0,
                      pointerEvents: 'none',
                      boxSizing: 'border-box',
                      zIndex: 4,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: `${safeInsetMm}mm`,
                      top: `${safeInsetMm}mm`,
                      width: `${safeWidthMm}mm`,
                      height: `${safeHeightMm}mm`,
                      border: '1.5px dashed #1D4ED8',
                      borderRadius: 0,
                      pointerEvents: 'none',
                      boxSizing: 'border-box',
                      zIndex: 5,
                    }}
                  />
                </>
              )}
              {sequenceWithOffsets.map((item) => (
                renderSlotAt(item.key, item.start, 0, { showGuides: !showGroupGuides })
              ))}
            </>
          ),
        };
      }
      if (activeGroup.key === 'disc') {
        const widthMm = CD.disc.bleedD;
        const heightMm = CD.disc.bleedD;
        return {
          title: 'CD 디스크',
          widthMm,
          heightMm,
          nodes: (
            <>
              {plate(widthMm, heightMm)}
              {renderSlotAt('cd-disc', 0, 0)}
            </>
          ),
        };
      }
    }

    if (template === '4x5') {
      const partKey = activeGroup.parts[0];
      const widthMm = FOUR_FIVE.bleedW;
      const heightMm = FOUR_FIVE.bleedH;
      return {
        title: activeGroup.key === 'front' ? '앞면' : '뒷면',
        widthMm,
        heightMm,
        nodes: (
          <>
            {plate(widthMm, heightMm)}
            {renderSlotAt(partKey, 0, 0)}
          </>
        ),
      };
    }

    return null;
  }, [activeGroup, renderSlotAt, template]);

  const getPartLabel = useCallback((partKey: string) => {
    switch (partKey) {
      case 'cd-front-left':
        return '바깥';
      case 'cd-front-right':
        return '안쪽';
      case 'cd-back-outside':
        return '뒷면';
      case 'cd-back-inside':
        return '안쪽';
      case 'cd-spine-1':
        return '옆 1';
      case 'cd-spine-2':
        return '옆 2';
      case 'cd-spine-3':
        return '옆 3';
      case 'cd-disc':
        return '디스크';
      case '4x5-front':
        return '앞';
      case '4x5-back':
        return '뒤';
      default:
        return partKey;
    }
  }, []);

  const handlePasteAction = useCallback(() => {
    if (isMobile) setShowPasteModal(true);
    else void tryReadClipboard();
  }, [isMobile, tryReadClipboard]);

  const openUrlModal = useCallback(() => setShowUrlModal(true), []);

  const controlButtonClass = 'flex min-w-[76px] snap-start flex-col items-center justify-center gap-1 rounded-2xl bg-slate-800 px-3 py-3 text-[11px] font-medium text-slate-200 shadow-inner shadow-slate-950/40 transition hover:bg-slate-700 active:scale-95';

  const rootControls: ControlItem[] = [
    { key: 'panel-view', icon: '🔍', label: '화면 조정', onClick: () => setControlPanel('view') },
    { key: 'panel-image', icon: '🖼️', label: '이미지 조정', onClick: () => setControlPanel('image') },
    { key: 'panel-input', icon: '�', label: '이미지 불러오기', onClick: () => setControlPanel('input') },
    { key: 'panel-history', icon: '🕓', label: '작업 기록', onClick: () => setControlPanel('history') },
  ];

  const viewControls: ControlItem[] = [
    { key: 'viewer-zoom-in', icon: '�＋', label: '뷰 확대', onClick: () => adjustViewerZoom(1) },
    { key: 'viewer-zoom-out', icon: '�－', label: '뷰 축소', onClick: () => adjustViewerZoom(-1) },
    { key: 'viewer-reset', icon: '◻️', label: '뷰 초기화', onClick: resetViewerZoom },
  ];

  const imageControls: ControlItem[] = [
    { key: 'img-zoom-in', icon: '＋', label: '이미지 확대', onClick: () => zoom(1) },
    { key: 'img-zoom-out', icon: '－', label: '이미지 축소', onClick: () => zoom(-1) },
    { key: 'cover', icon: '🖼️', label: '맞춤', onClick: coverCurrent },
    { key: 'reset', icon: '⟲', label: '초기화', onClick: resetCurrent },
    { key: 'up', icon: '↑', label: '위로', onClick: () => nudge(0, 1) },
    { key: 'down', icon: '↓', label: '아래로', onClick: () => nudge(0, -1) },
    { key: 'left', icon: '←', label: '왼쪽', onClick: () => nudge(1, 0) },
    { key: 'right', icon: '→', label: '오른쪽', onClick: () => nudge(-1, 0) },
  ];

  const inputControls: ControlItem[] = [
    { key: 'paste', icon: '📋', label: '붙여넣기', onClick: handlePasteAction },
    { key: 'url', icon: '🔗', label: 'URL 입력', onClick: openUrlModal },
  ];

  const historyControls: ControlItem[] = [
    { key: 'undo', icon: '↩️', label: '되돌리기', onClick: () => undo() },
    { key: 'redo', icon: '↪️', label: '다시하기', onClick: () => redo() },
  ];

  const currentControls: ControlItem[] = controlPanel === 'root'
    ? rootControls
    : controlPanel === 'view'
    ? viewControls
    : controlPanel === 'image'
    ? imageControls
    : controlPanel === 'input'
    ? inputControls
    : historyControls;

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-900 text-white">
      <div className="flex-1 overflow-y-auto pb-44 pt-20">
        <div className="mx-auto flex w-full max-w-screen-sm flex-col gap-4 px-4">
          <div
            ref={stageWrapperRef}
            className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-3xl bg-slate-800/60 p-6 shadow-[0_40px_80px_-32px_rgba(15,23,42,0.65)] sm:min-h-[420px]"
          >
            {preview ? (
              <div
                ref={stageTransformRef}
                style={{ transform: `scale(${stageScale * viewerZoom})`, transformOrigin: '50% 50%' }}
                className="transition-transform duration-150 ease-out"
              >
                <div
                  ref={stageInnerRef}
                  className="relative"
                  style={{ width: `${preview.widthMm}mm`, height: `${preview.heightMm}mm` }}
                >
                  {preview.nodes}
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-300">선택 가능한 파트가 없습니다.</div>
            )}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[132px] h-32 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="mx-auto w-full max-w-screen-sm space-y-3 px-4 py-4">
          {activeGroup && activeGroup.parts.length > 1 && (
            <div className="flex items-center justify-center gap-2">
              {activeGroup.parts.map(partKey => (
                <button
                  key={partKey}
                  type="button"
                  onClick={() => activatePart(partKey)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active === partKey ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  {getPartLabel(partKey)}
                </button>
              ))}
            </div>
          )}

          {controlPanel !== 'root' && (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setControlPanel('root')}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-blue-400 hover:text-blue-100"
              >
                <span className="text-base leading-none">←</span>
                <span>뒤로가기</span>
              </button>
              {controlPanel === 'view' && (
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                  배율 ×{viewerZoom.toFixed(2)}
                </span>
              )}
            </div>
          )}

          <div className="flex snap-x gap-2 overflow-x-auto pb-1">
            {currentControls.map((button) => (
              <button
                key={button.key}
                type="button"
                className={`${controlButtonClass} ${button.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                onClick={() => { if (!button.disabled) button.onClick(); }}
                aria-label={button.label}
                disabled={button.disabled}
              >
                <span className="text-2xl leading-none">{button.icon}</span>
                <span>{button.label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => void generateQR()}
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/40 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading ? '완료 중...' : '완료'}
            </button>

            {qrUrl && (
              <button
                type="button"
                className="inline-flex items-center gap-3 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-blue-400 hover:text-blue-100"
                onClick={() => setShowQrModal(true)}
              >
                <img src={qrUrl} alt="QR Code" className="h-12 w-12 rounded-xl border border-slate-700 object-contain" />
                <span>QR 미리 보기</span>
              </button>
            )}
          </div>

          {clipboardMessage && (
            <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-center text-sm text-blue-200">
              {clipboardMessage}
            </div>
          )}
        </div>
      </div>

      <input
        ref={pasteRef}
        type="text"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        onPaste={(e) => handlePasteEvent(e as unknown as React.ClipboardEvent)}
        tabIndex={-1}
      />

      {showPasteModal && (
        <MobilePasteModal
          onClose={() => setShowPasteModal(false)}
          onPasted={(value) => { handlePaste(value); setShowPasteModal(false); }}
        />
      )}

      {showUrlModal && (
        <UrlPasteModal
          onClose={() => setShowUrlModal(false)}
          onSubmit={(url: string) => { handlePaste(url); setShowUrlModal(false); setClipboardMessage('이미지 주소를 불러왔어요.'); }}
        />
      )}

      {showQrModal && qrUrl && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" onClick={() => setShowQrModal(false)}>
          <div className="rounded-2xl bg-white p-4 text-slate-800 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 text-base font-semibold">QR 코드</div>
            <img src={qrUrl} alt="QR Code" className="h-60 w-60 object-contain" />
            <div className="mt-3 text-right">
              <button className="btn btn-outline px-3 py-1.5" onClick={() => setShowQrModal(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ImageEditor;

// 모바일 붙여넣기 모달: contenteditable 필드에 길게 눌러 "붙여넣기" → 이미지/URL 감지
type MobilePasteModalProps = {
  onClose: () => void;
  onPasted: (value: string) => void; // dataURL 또는 URL
};
const MobilePasteModal: React.FC<MobilePasteModalProps> = ({ onClose, onPasted }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState('여기를 길게 눌러 붙여넣기 (이미지 주소만 지원)');

  const extractFromEditable = useCallback(async () => {
    const root = ref.current;
    if (!root) return;
    // 이미지 요소에서 http(s) 주소만 사용
    const img = root.querySelector('img') as HTMLImageElement | null;
    if (img?.src) {
      const src = img.src;
      if (/^https?:\/\//i.test(src)) {
        onPasted(src);
        setHint('이미지 주소를 불러왔어요.');
        return;
      } else {
        setHint('이미지 주소만 지원합니다. (이미지 위에서 "이미지 주소 복사"를 사용)');
      }
    }
    // 텍스트 URL
    const text = root.innerText?.trim();
    if (text && /^https?:\/\//i.test(text)) {
      onPasted(text);
      setHint('이미지 주소를 불러왔어요.');
      return;
    }
    // 빈 내용일 때는 에러 문구를 띄우지 않음 (길게 누르기 전/중 시점 방지)
    const hasContent = (root.innerHTML && root.innerHTML.trim().length > 0);
  if (hasContent) setHint('붙여넣은 내용에서 이미지 주소를 찾지 못했어요.');
  }, [onPasted]);

  const onPaste: React.ClipboardEventHandler<HTMLDivElement> = async () => {
    // DOM 업데이트 후 추출
    setTimeout(() => extractFromEditable(), 0);
  };
  const onInput: React.FormEventHandler<HTMLDivElement> = async () => {
    setTimeout(() => extractFromEditable(), 0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm bg-white text-slate-800 rounded-2xl shadow-lg p-4">
        <div className="text-base font-semibold mb-2">이미지 붙여넣기</div>
        <div className="text-sm text-slate-600 mb-2">아래 상자를 길게 눌러 "붙여넣기"를 선택하세요.</div>
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onPaste={onPaste}
          onInput={onInput}
          className="border rounded-lg h-32 p-2 overflow-auto focus:outline-none"
          style={{ WebkitUserSelect: 'text' as any }}
        />
        <div className="text-xs text-blue-700 mt-2 min-h-[1rem]">{hint}</div>
        <div className="mt-3 flex justify-end gap-2">
          <button className="btn btn-outline px-3 py-1.5" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};