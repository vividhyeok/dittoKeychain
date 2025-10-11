import { useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { decodeFromScan } from '../utils/encode';
import { staffStore } from '../utils/staffStore';
import { useNavigate } from 'react-router-dom';
import { Payload4x5, Payload } from '../types';

const ScanLoad = () => {
  const [payloads, setPayloads] = useState<Payload[]>([]);
  const [imageUrl, setImageUrl] = useState('');
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
      const payload = decodeFromScan(text) as Payload;
      if (payload?.tpl === '4x5' || payload?.tpl === 'cd') {
        setPayloads(prev => [...prev, payload]);
      } else {
        console.warn('지원하지 않는 페이로드', payload);
      }
    } catch (err) {
      console.error(err);
      alert('카메라 접근 실패: ' + (err as Error).message);
    }
  };

  const loadFromUrl = () => {
    if (imageUrl) {
      // 간단히 front로 설정
      const payload: Payload4x5 = {
        v: 1,
        tpl: '4x5',
        front: { part: '4x5-front', img: imageUrl, tx: 0, ty: 0, scale: 1, rot: 0 },
        back: { part: '4x5-back', img: imageUrl, tx: 0, ty: 0, scale: 1, rot: 0 }
      };
      setPayloads(prev => [...prev, payload]);
      setImageUrl('');
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-800 text-white p-4">
      <h1 className="text-xl font-bold mb-4">이미지 불러오기</h1>
      <div className="mb-4">
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="이미지 URL 입력"
          className="w-full p-2 bg-gray-700 text-white rounded mb-2"
        />
        <div className="flex gap-2">
          <button onClick={loadFromUrl} className="bg-green-600 text-white px-4 py-2 rounded">URL에서 불러오기</button>
          <button onClick={scan} className="bg-blue-600 text-white px-4 py-2 rounded">QR 인식</button>
          <button onClick={goPreview} className="bg-gray-600 text-white px-4 py-2 rounded">미리보기 로드</button>
        </div>
      </div>
      <div className="mb-4">
        <video id="video" width="480" height="320" className="border mb-2 w-full max-w-md" playsInline></video>
        <p className="text-sm text-gray-300">카메라가 보이지 않으면 HTTPS 환경(Vercel 등)에서 접속하거나 주소창의 카메라 권한을 확인하세요.</p>
      </div>
      <div className="mt-2 text-sm text-gray-300">수집됨: CD {payloads.filter(p=>p.tpl==='cd').length} / 4x5 {payloads.filter(p=>p.tpl==='4x5').length}</div>
    </div>
  );
};

export default ScanLoad;