import { useCallback, useEffect, useRef, useState } from 'react';
import { PartSpec } from '../types';

export const useImageEditor = (initialSpecs: Record<string, PartSpec>) => {
  const [specs, setSpecs] = useState(initialSpecs);
  const [active, setActive] = useState(Object.keys(initialSpecs)[0]);
  const [history, setHistory] = useState<PartSpec[][]>([Object.values(initialSpecs)]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const pasteRef = useRef<HTMLInputElement>(null);

  const updateSpec = useCallback((key: string, updater: (s: PartSpec) => PartSpec) => {
    setSpecs(prev => {
      const newSpecs = { ...prev, [key]: updater(prev[key]) };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(Object.values(newSpecs));
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      return newSpecs;
    });
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const prevSpecs = history[historyIndex - 1];
      setSpecs(Object.fromEntries(Object.keys(specs).map((key, i) => [key, prevSpecs[i]])));
    }
  }, [history, historyIndex, specs]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const nextSpecs = history[historyIndex + 1];
      setSpecs(Object.fromEntries(Object.keys(specs).map((key, i) => [key, nextSpecs[i]])));
    }
  }, [history, historyIndex, specs]);

  const cover = (s: PartSpec) => ({ ...s, tx: 0, ty: 0, scale: 1, rot: 0 });
  const fitW = (s: PartSpec) => ({ ...s, ty: 0 });
  const fitH = (s: PartSpec) => ({ ...s, tx: 0 });
  const center = (s: PartSpec) => ({ ...s, tx: 0, ty: 0 });
  const nudge = (dx: number, dy: number) => updateSpec(active, s => ({ ...s, tx: s.tx + dx, ty: s.ty + dy }));
  const zoom = (sign: 1 | -1) => updateSpec(active, s => ({ ...s, scale: Math.max(0.2, Math.min(5, s.scale * (sign === 1 ? 1.05 : 0.95))) }));

  return {
    specs,
    active,
    setActive,
    updateSpec,
    undo,
    redo,
    cover,
    fitW,
    fitH,
    center,
    nudge,
    zoom,
    pasteRef,
  };
};

export const useClipboardPaste = (
  onPaste: (dataUrl: string) => void,
  onError?: (message: string) => void
) => {
  const extractUrlFromHtml = (html: string): string | null => {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const img = doc.querySelector('img');
      if (img && img.getAttribute('src')) {
        const src = img.getAttribute('src')!;
        if (/^https?:\/\//i.test(src) || src.startsWith('data:')) return src;
      }
      // 링크 텍스트도 검사
      const a = doc.querySelector('a[href]') as HTMLAnchorElement | null;
      if (a && /^https?:\/\//i.test(a.href)) return a.href;
    } catch {}
    return null;
  };

  const readClipboard = useCallback(async () => {
    const clipboard = navigator.clipboard as any;
    let handled = false;

    if (clipboard?.read) {
      try {
        const items: ClipboardItem[] = await clipboard.read();
        // 1) 우선 text/html에서 이미지 URL 또는 링크 추출
        for (const item of items as any[]) {
          const types: string[] = (item.types || []) as string[];
          if (types.includes('text/html')) {
            try {
              const blob = await (item as any).getType('text/html');
              const htmlText = await blob.text();
              const url = extractUrlFromHtml(htmlText);
              if (url && /^https?:\/\//i.test(url)) {
                onPaste(url);
                handled = true;
                break;
              }
            } catch {}
          }
        }
        // 2) text/plain에 URL이 있으면 사용
        if (!handled) {
          for (const item of items as any[]) {
            const types: string[] = (item.types || []) as string[];
            if (types.includes('text/plain')) {
              try {
                const blob = await (item as any).getType('text/plain');
                const text = (await blob.text()).trim();
                if (/^https?:\/\//i.test(text)) {
                  onPaste(text);
                  handled = true;
                  break;
                }
              } catch {}
            }
          }
        }
      } catch (err) {
        console.warn('clipboard.read 실패:', err);
      }
    }

    if (!handled && clipboard?.readText) {
      try {
        const text = await clipboard.readText();
        const trimmed = text?.trim();
        if (trimmed && /^(https?:\/\/|data:)/i.test(trimmed)) {
          onPaste(trimmed);
          handled = true;
        }
      } catch (err) {
        console.warn('clipboard.readText 실패:', err);
      }
    }

    if (!handled) {
      onError?.('클립보드에서 붙여 넣을 이미지를 찾지 못했어요. 다른 방법(붙여넣기 단축키 등)을 시도해 보세요.');
    }

    return handled;
  }, [onPaste, onError]);

  const handlePasteEvent = useCallback(
    async (evt: ClipboardEvent | React.ClipboardEvent) => {
      const cd = ('clipboardData' in evt && evt.clipboardData) ? evt.clipboardData : (window as any).clipboardData;
      if (!cd) return;

      // 1) text/html에서 이미지 URL 우선 추출
      const html = cd.getData && cd.getData('text/html');
      if (html) {
        const url = extractUrlFromHtml(html);
        if (url && /^https?:\/\//i.test(url)) {
          evt.preventDefault?.();
          onPaste(url);
          return;
        }
      }

      const text = cd.getData ? cd.getData('text') : '';
      if (text) {
        const t = text.trim();
        const isUrl = /^https?:\/\//i.test(t);
        if (isUrl) {
          evt.preventDefault?.();
          onPaste(t);
          return;
        }
      }

      onError?.('붙여넣은 내용에서 이미지를 찾지 못했어요.');
    },
    [onPaste, onError]
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => handlePasteEvent(e);
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [handlePasteEvent]);

  return { handlePasteEvent, readClipboard };
};