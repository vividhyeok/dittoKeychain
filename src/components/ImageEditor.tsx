import React, { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Sheet from './Sheet';
import Slot from './Slot';
import { useImageEditor, useClipboardPaste } from '../hooks/useImageEditor';
import { useIsMobile } from '../hooks/useIsMobile';
import { PartSpec } from '../types';
import { encodePayload } from '../utils/encode';

interface ImageEditorProps {
  template: '4x5' | 'cd3';
  initialSpecs: Record<string, PartSpec>;
  qrPayload: (specs: Record<string, PartSpec>) => any;
}

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

const ImageEditor: React.FC<ImageEditorProps> = ({ template, initialSpecs, qrPayload }) => {
  const isMobile = useIsMobile();
  const { specs, active, setActive, updateSpec, undo, redo, nudge, zoom, pasteRef } = useImageEditor(initialSpecs);
  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [clipboardMessage, setClipboardMessage] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);

  const generateQR = async () => {
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
            return `${window.location.origin}/p/${template}?data=${data}`;
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
  };

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

  const controlButtonClass = 'btn-icon text-lg font-semibold';
  const panelClass = 'card p-4 flex flex-col items-center gap-3';
  const tabs = Object.keys(specs);
  const positions = template === '4x5' ? ['25%', '75%'] : ['22%', '50%', '78%'];

  return (
  <div className="page p-3 md:p-4 overflow-hidden">
      <h1 className="text-xl font-bold mb-4 text-center">{template === '4x5' ? '4×5 키링 편집' : 'CD형 키링 편집'}</h1>
      <div className="flex flex-row items-stretch justify-center gap-3 md:gap-6 h-[calc(100vh-110px)]">
        <div className="relative inline-block flex-1 min-w-[260px] overflow-hidden">
          <Sheet responsive={isMobile} scale={isMobile ? (template === '4x5' ? 0.62 : 0.7) : 0.82}>
            {/* 상단 탭 */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2 z-10 bg-white/90 text-slate-800 rounded shadow inline-flex overflow-hidden">
              {tabs.map(tab => (
                <button
                  key={tab}
                  className={`px-4 py-2 transition-colors ${active === tab ? 'bg-blue-100 text-blue-900' : 'hover:bg-slate-100/80 text-slate-800'}`}
                  onClick={() => setActive(tab)}
                >
                  {tab === '4x5-front' ? '앞면' : tab === '4x5-back' ? '뒷면' : tab === 'cd-disc' ? 'CD' : tab === 'case-front' ? '앞' : '뒤'}
                </button>
              ))}
            </div>

            {/* 슬롯들 */}
            {tabs.map((tab, i) => (
              <div key={tab} style={{ position: 'absolute', left: '50%', top: positions[i], transform: 'translateX(-50%)' }}>
                <Slot
                  part={specs[tab].part}
                  spec={specs[tab]}
                  onUpdate={(s) => updateSpec(tab, () => s)}
                  onClick={() => {
                    setActive(tab);
                    pasteRef.current?.focus();
                    tryReadClipboard();
                  }}
                  isActive={active === tab}
                />
              </div>
            ))}
          </Sheet>
        </div>

        <div className="flex flex-col items-center gap-3 w-[86px] md:w-[96px]">
          <div className={`${panelClass} w-full items-stretch gap-3`}>
            <button
              className={controlButtonClass}
              onClick={() => {
                if (isMobile) setShowPasteModal(true); else tryReadClipboard();
              }}
              aria-label="이미지 붙여넣기"
              title="이미지 붙여넣기"
            >
              📋
            </button>
            <button className={controlButtonClass} onClick={() => setShowUrlModal(true)} aria-label="URL 입력" title="이미지 주소 입력">🔗</button>
            <button className={controlButtonClass} onClick={() => zoom(1)} aria-label="확대">＋</button>
            <button className={controlButtonClass} onClick={() => zoom(-1)} aria-label="축소">－</button>
            <button className={controlButtonClass} onClick={() => nudge(0, 1)} aria-label="위로">↑</button>
            <button className={controlButtonClass} onClick={() => nudge(0, -1)} aria-label="아래로">↓</button>
            <button className={controlButtonClass} onClick={() => nudge(1, 0)} aria-label="왼쪽">←</button>
            <button className={controlButtonClass} onClick={() => nudge(-1, 0)} aria-label="오른쪽">→</button>
          </div>

          <div className={`${panelClass} w-full my-auto`}>
            <button onClick={generateQR} disabled={loading} className="w-full px-3 py-2 bg-blue-500 text-white rounded-full shadow disabled:opacity-50 hover:bg-blue-600 active:scale-95 transition text-sm">
              {loading ? '완료 중...' : '완료'}
            </button>
            {qrUrl && (
              <div className="bg-white rounded shadow p-2">
                <img src={qrUrl} alt="QR Code" className="w-36 h-36 object-contain" />
              </div>
            )}
            {clipboardMessage && (
              <div className="text-xs text-blue-600 bg-white/80 backdrop-blur px-3 py-2 rounded-xl shadow text-center">
                {clipboardMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 숨김 paste 포커스 타겟 */}
      <input
        ref={pasteRef}
        type="text"
        aria-hidden="true"
        className="opacity-0 w-0 h-0 absolute -left-[9999px]"
        onPaste={(e) => handlePasteEvent(e as unknown as React.ClipboardEvent)}
        tabIndex={-1}
      />

      {/* 모바일 붙여넣기 모달 */}
      {showPasteModal && (
        <MobilePasteModal
          onClose={() => setShowPasteModal(false)}
          onPasted={(value) => { handlePaste(value); setShowPasteModal(false); }}
        />
      )}

      {/* URL 입력 모달 */}
      {showUrlModal && (
        <UrlPasteModal
          onClose={() => setShowUrlModal(false)}
          onSubmit={(url: string) => { handlePaste(url); setShowUrlModal(false); setClipboardMessage('이미지 주소를 불러왔어요.'); }}
        />
      )}

      {/* QR 플로팅 모달 */}
      {showQrModal && qrUrl && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setShowQrModal(false)}>
          <div className="bg-white text-slate-800 rounded-2xl shadow-xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-base font-semibold mb-2">QR 코드</div>
            <img src={qrUrl} alt="QR Code" className="w-60 h-60 object-contain" />
            <div className="mt-3 text-right">
              <button className="btn btn-outline px-3 py-1.5" onClick={() => setShowQrModal(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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