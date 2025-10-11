import { useMemo } from 'react';
import Sheet from '../components/Sheet';
import Slot from '../components/Slot';
import { PartSpec } from '../types';
import { staffStore } from '../utils/staffStore';

const FourUp = () => {
  // 스태프 모드: 편집 불가, 스캔한 설정 그대로 배치
  const scanned = useMemo(() => staffStore.getFourUp() || [], []);
  const AFront = scanned[0]?.front as PartSpec | undefined;
  const BFront = scanned[1]?.front as PartSpec | undefined;
  const CFront = scanned[2]?.front as PartSpec | undefined;
  const DFront = scanned[3]?.front as PartSpec | undefined;


  const downloadPng = async () => {
    // 간단 캔버스 렌더링: A6 (100x148mm) @ 300dpi → 1181 x 1748 px 정도. 메모리 고려해 600~900dpi는 피함.
    const dpi = 300; // Selphy 용 충분
    const mmToPx = (mm: number) => Math.round((mm / 25.4) * dpi);
    const W = mmToPx(100); // 100mm
    const H = mmToPx(148); // 148mm
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    const drawPart = async (p: PartSpec, xMm: number, yMm: number, vpWmm: number, vpHmm: number) => {
      if (!p?.img) return;
      const x = mmToPx(xMm), y = mmToPx(yMm);
      const vpW = mmToPx(vpWmm), vpH = mmToPx(vpHmm);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, vpW, vpH);
      ctx.clip();
      const img = await new Promise<HTMLImageElement>((res, rej) => { const im = new Image(); im.crossOrigin='anonymous'; im.onload=() => res(im); im.onerror=rej; im.src=p.img!; });
      // object-fit: contain + mm 기반 transform 적용
      const txPx = mmToPx(p.tx), tyPx = mmToPx(p.ty);
      const scale = p.scale || 1;
      // 이미지를 viewport에 contain: 전체 보이기 - 편집이 아닌 수용 단계
      const rW = vpW; const rH = vpH;
      const scaleContain = Math.min(rW / img.width, rH / img.height);
      const drawW = img.width * scaleContain * scale;
      const drawH = img.height * scaleContain * scale;
      const cx = x + (vpW - drawW) / 2 + txPx;
      const cy = y + (vpH - drawH) / 2 + tyPx;
      ctx.drawImage(img, cx, cy, drawW, drawH);
      ctx.restore();
    };

    await drawPart(AFront!, 2, 2, 35, 45);
    await drawPart(BFront!, 44, 2, 35, 45);
    await drawPart(CFront!, 2, 54, 35, 45);
    await drawPart(DFront!, 44, 54, 35, 45);

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/jpeg', 0.92);
    a.download = 'fourup-a6.jpg';
    a.click();
  };

  return (
    <div className="page p-4">
      <div className="card p-4 mb-3">
        <div className="flex items-center justify-between">
          <h1 className="heading">4-up</h1>
          <div className="flex gap-2">
            <a href="/s/load" className="btn btn-outline">불러오기</a>
            <button onClick={() => window.print()} className="btn btn-secondary">미리보기(인쇄)</button>
            <button onClick={downloadPng} className="btn btn-primary">이미지로 저장</button>
          </div>
        </div>
      </div>
      <Sheet responsive origin="top-left">
        <div style={{ position: 'absolute', left: '2mm', top: '2mm' }}>
          <Slot anchor="top-left" part="4x5-front" spec={AFront || { part: '4x5-front', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={true} />
        </div>
        <div style={{ position: 'absolute', left: '44mm', top: '2mm' }}>
          <Slot anchor="top-left" part="4x5-front" spec={BFront || { part: '4x5-front', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={true} />
        </div>
        <div style={{ position: 'absolute', left: '2mm', top: '54mm' }}>
          <Slot anchor="top-left" part="4x5-front" spec={CFront || { part: '4x5-front', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={true} />
        </div>
        <div style={{ position: 'absolute', left: '44mm', top: '54mm' }}>
          <Slot anchor="top-left" part="4x5-front" spec={DFront || { part: '4x5-front', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={true} />
        </div>
      </Sheet>
    </div>
  );
};

export default FourUp;