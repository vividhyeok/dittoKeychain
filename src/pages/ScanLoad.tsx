import { useRef, useState, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { decodeFromScan, extractEncodedFromText } from '../utils/encode';
import { staffStore } from '../utils/staffStore';
import { useNavigate } from 'react-router-dom';
import { Payload4x5, Payload } from '../types';

const ScanLoad = () => {
  const [payloads, setPayloads] = useState<Payload[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastHit, setLastHit] = useState<{ type: 'cd' | '4x5'; ts: number } | null>(null);
  const navigate = useNavigate();
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const seenRef = useRef<Set<string>>(new Set());

  const startScan = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('카메라가 지원되지 않는 브라우저입니다. HTTPS에서 시도하세요.');
      return;
    }
    if (!readerRef.current) readerRef.current = new BrowserMultiFormatReader();
    try {
      await readerRef.current.decodeFromVideoDevice(null, 'video', (result, err) => {
        if (result) {
          const raw = result.getText();
          const key = extractEncodedFromText(raw) || raw;
          if (key && !seenRef.current.has(key)) {
            seenRef.current.add(key);
            try {
              const payload = decodeFromScan(raw) as Payload;
              if (payload?.tpl === '4x5' || payload?.tpl === 'cd') {
                setPayloads(prev => [...prev, payload]);
                setLastHit({ type: payload.tpl, ts: Date.now() });
              }
            } catch (e) {
              console.warn('디코딩 실패:', e);
            }
          }
        }
        if (err && !(err instanceof Error && (err as any).name === 'NotFoundException')) {
          // 잔여 에러는 로그만
          // console.error(err);
        }
      });
      setIsScanning(true);
    } catch (err) {
      console.error('카메라 시작 실패:', err);
      alert('카메라 시작 실패: ' + (err as Error).message);
    }
  };

  const stopScan = () => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (readerRef.current) readerRef.current.reset();
    };
  }, []);

  const goPreview = () => {
    // 우선순위: cd payload가 있으면 CD 미리보기로, 아니면 4x5가 2개 있으면 FourUp으로
    const cd = payloads.find(p => p.tpl === 'cd');
    if (cd && cd.tpl === 'cd') {
      staffStore.setCd(cd);
      navigate('/s/cd');
      return;
    }
    const four = payloads.filter(p => p.tpl === '4x5') as Payload4x5[];
    if (four.length >= 2) {
      staffStore.setFourUp(four.slice(0, 2));
      navigate('/s/4up');
      return;
    }
    alert('미리보기를 위해서는 CD 1개 또는 4x5 2개가 필요합니다.');
  };

  const resetAll = () => {
    setPayloads([]);
    seenRef.current.clear();
    setLastHit(null);
  };

  return (
    <div className="page p-4">
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="heading">QR 인식</h1>
          <div className="flex gap-2">
            {!isScanning ? (
              <button className="btn btn-primary" onClick={startScan}>스캔 시작</button>
            ) : (
              <button className="btn btn-outline" onClick={stopScan}>스캔 중지</button>
            )}
            <button className="btn btn-secondary" onClick={resetAll}>초기화</button>
            <button className="btn btn-primary" onClick={goPreview} disabled={!(payloads.find(p=>p.tpl==='cd') || payloads.filter(p=>p.tpl==='4x5').length>=2)}>
              미리보기 이동
            </button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 items-start">
          <div className="relative">
            <video id="video" width="480" height="320" className="w-full max-w-lg border border-white/10 rounded-lg" playsInline></video>
            {lastHit && Date.now() - lastHit.ts < 1500 && (
              <div className="absolute top-2 right-2 bg-emerald-500 text-white text-sm px-2 py-1 rounded-md shadow">
                {lastHit.type === 'cd' ? 'CD 저장됨' : '4x5 저장됨'}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-slate-300">수집됨</span>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-slate-700 text-white">CD {payloads.filter(p=>p.tpl==='cd').length}</span>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-slate-700 text-white">4x5 {payloads.filter(p=>p.tpl==='4x5').length}</span>
            </div>
            <div className="h-40 overflow-auto border border-white/10 rounded-md p-2 text-sm text-slate-300">
              {payloads.length === 0 ? (
                <div className="text-slate-500">아직 인식된 QR이 없습니다.</div>
              ) : (
                <ul className="space-y-1">
                  {payloads.map((p, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span>{p.tpl === 'cd' ? 'CD' : '4x5'} #{i+1}</span>
                      <span className="text-xs text-slate-500">v{p.v}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-2">HTTPS 환경에서만 카메라 사용이 가능합니다. 브라우저 권한을 허용해 주세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanLoad;