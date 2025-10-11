import { useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { decodeFromScan } from '../utils/encode';
import { staffStore } from '../utils/staffStore';
import { useNavigate } from 'react-router-dom';
import { Payload4x5 } from '../types';

const Scan2 = () => {
  const [payloads, setPayloads] = useState<Payload4x5[]>([]);
  const navigate = useNavigate();
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const scan = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('카메라가 지원되지 않는 브라우저입니다. HTTPS에서 시도하세요.');
      return;
    }
    if (!readerRef.current) readerRef.current = new BrowserMultiFormatReader();
    try {
      const result = await readerRef.current.decodeOnceFromVideoDevice(undefined, 'video');
  const text = result.getText();
  // 전체 URL, 해시, 또는 압축 문자열 모두 허용
  const payload = decodeFromScan(text) as Payload4x5;
      if (payload?.tpl === '4x5') {
        setPayloads(prev => [...prev, payload]);
      } else {
        console.warn('지원하지 않는 페이로드', payload);
      }
    } catch (err) {
      console.error(err);
      alert('카메라 접근 실패: ' + (err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white p-4">
      <h1 className="text-xl font-bold mb-4">QR 2개 스캔</h1>
      <button onClick={scan} className="bg-gray-600 text-white px-4 py-2 rounded mb-4">스캔</button>
      <video id="video" width="300" height="200"></video>
      <ul>
        {payloads.map((p, i) => <li key={i}>{p.tpl} #{i+1}</li>)}
      </ul>
      {payloads.length >= 2 && (
        <div className="mt-4">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => { staffStore.setFourUp(payloads.slice(0,2)); navigate('/s/4up'); }}
          >
            스캔 완료 → 4-up으로 이동
          </button>
        </div>
      )}
    </div>
  );
};

export default Scan2;