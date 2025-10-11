import { useRef, useState, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { decodeFromScan } from '../utils/encode';
import { staffStore } from '../utils/staffStore';
import { useNavigate } from 'react-router-dom';
import { Payload4x5 } from '../types';
import Sheet from '../components/Sheet';
import Slot from '../components/Slot';

const Scan4 = () => {
  const [payloads, setPayloads] = useState<Payload4x5[]>([]);
  const navigate = useNavigate();
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const startScanning = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('카메라가 지원되지 않는 브라우저입니다.');
        return;
      }
      if (!readerRef.current) readerRef.current = new BrowserMultiFormatReader();
      try {
        await readerRef.current.decodeFromVideoDevice(null, 'video', (result, err) => {
          if (result) {
            const text = result.getText();
            const payload = decodeFromScan(text) as Payload4x5;
            if (payload?.tpl === '4x5') {
              setPayloads(prev => {
                if (prev.length < 4 && !prev.some(p => p.front?.img === payload.front?.img)) {
                  return [...prev, payload];
                }
                return prev;
              });
            }
          }
          if (err && !(err instanceof Error && err.name === 'NotFoundException')) {
            console.error(err);
          }
        });
      } catch (err) {
        console.error('카메라 시작 실패:', err);
      }
    };

    startScanning();

    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, []);

  const AFront = payloads[0]?.front as any;
  const BFront = payloads[1]?.front as any;
  const CFront = payloads[2]?.front as any;
  const DFront = payloads[3]?.front as any;

  return (
    <div className="min-h-screen bg-gray-800 text-white p-4">
      <h1 className="text-xl font-bold mb-4">QR 4개 스캔 및 미리보기</h1>
      <div className="mb-4">
        <video id="video" width="300" height="200" className="border"></video>
        <p className="mt-2">QR 코드를 카메라에 비추세요. 자동으로 스캔됩니다.</p>
      </div>
      <Sheet>
        <div style={{ position: 'absolute', left: '2mm', top: '2mm' }}>
          <Slot part="4x5-front" spec={AFront || { part: '4x5-front', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={false} />
        </div>
        <div style={{ position: 'absolute', left: '44mm', top: '2mm' }}>
          <Slot part="4x5-front" spec={BFront || { part: '4x5-front', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={false} />
        </div>
        <div style={{ position: 'absolute', left: '2mm', top: '54mm' }}>
          <Slot part="4x5-front" spec={CFront || { part: '4x5-front', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={false} />
        </div>
        <div style={{ position: 'absolute', left: '44mm', top: '54mm' }}>
          <Slot part="4x5-front" spec={DFront || { part: '4x5-front', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={false} />
        </div>
      </Sheet>
      <div className="mt-4">
        <p>스캔된 QR: {payloads.length}/4</p>
        {payloads.length >= 4 && (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
            onClick={() => { staffStore.setFourUp(payloads.slice(0,4)); navigate('/s/4up'); }}
          >
            완료 → 4-up으로 이동
          </button>
        )}
      </div>
    </div>
  );
};

export default Scan4;