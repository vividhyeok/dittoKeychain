import { compressToEncodedURIComponent as compress, decompressFromEncodedURIComponent as decompress } from 'lz-string';

export const encodePayload = (payload: any): string => {
  const json = JSON.stringify(payload);
  return compress(json);
};

export const decodePayload = (encoded: string): any => {
  const json = decompress(encoded);
  if (!json) throw new Error('Invalid encoded data');
  return JSON.parse(json);
};

// QR 스캔 텍스트가 전체 URL이거나 data=<...> 쿼리로 들어온 경우를 처리
export const extractEncodedFromText = (text: string): string | null => {
  // 1) URL로 파싱 시도
  try {
    const url = new URL(text);
    const q = url.searchParams.get('data');
    if (q) return q;
    if (url.hash) {
      const sp = new URLSearchParams(url.hash.replace(/^#/, ''));
      const hv = sp.get('data');
      if (hv) return hv;
    }
  } catch {}
  // 2) 쿼리스트링 패턴 수동 추출
  const m = text.match(/[?&#]data=([^&#]+)/);
  if (m && m[1]) {
    try { return decodeURIComponent(m[1]); } catch { return m[1]; }
  }
  // 3) 그대로 반환 (압축 문자열이라고 가정)
  return text || null;
};

export const decodeFromScan = (text: string): any => {
  const encoded = extractEncodedFromText(text);
  if (!encoded) throw new Error('Invalid encoded data');
  return decodePayload(encoded);
};