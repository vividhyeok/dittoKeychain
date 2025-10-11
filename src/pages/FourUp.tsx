import { useMemo } from 'react';
import Sheet from '../components/Sheet';
import Slot from '../components/Slot';
import { PartSpec } from '../types';
import { staffStore } from '../utils/staffStore';
import { SHEET, GAP, FOUR_FIVE, DPI, mmToPx } from '../utils/printSpecs';

const FourUp = () => {
  // 스태프 모드: 편집 불가, 스캔한 설정 그대로 배치
  const scanned = useMemo(() => staffStore.getFourUp() || [], []);
  const A = scanned[0] as any | undefined;
  const B = scanned[1] as any | undefined;
  const AFront = A?.front as PartSpec | undefined;
  const ABack = A?.back as PartSpec | undefined;
  const BFront = B?.front as PartSpec | undefined;
  const BBack = B?.back as PartSpec | undefined;


  const downloadPng = async () => {
    // 간단 캔버스 렌더링: A6 (100x148mm) @ 300dpi → 1181 x 1748 px 정도. 메모리 고려해 600~900dpi는 피함.
  const dpi = DPI; // 300dpi 기본
  const toPx = (mm: number) => mmToPx(mm, dpi);
  const W = toPx(SHEET.widthMm);
  const H = toPx(SHEET.heightMm);
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    const drawPart = async (p: PartSpec, xMm: number, yMm: number, vpWmm: number, vpHmm: number) => {
      if (!p?.img) return;
  const x = toPx(xMm), y = toPx(yMm);
  const vpW = toPx(vpWmm), vpH = toPx(vpHmm);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, vpW, vpH);
      ctx.clip();
      const img = await new Promise<HTMLImageElement>((res, rej) => { const im = new Image(); im.crossOrigin='anonymous'; im.onload=() => res(im); im.onerror=rej; im.src=p.img!; });
      // object-fit: contain + mm 기반 transform 적용
  const txPx = toPx(p.tx), tyPx = toPx(p.ty);
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

  // 좌상단: A 앞, 우상단: A 뒤, 좌하단: B 앞, 우하단: B 뒤
  const OM = SHEET.outerMarginMm; // 외곽 여백
  const GAPMM = GAP.tileMm; // 타일 간격
  const VPW = FOUR_FIVE.viewportW;
  const VPH = FOUR_FIVE.viewportH;
  const X1 = OM;
  const X2 = OM + VPW + GAPMM;
  const Y1 = OM;
  const Y2 = OM + VPH + GAPMM + (FOUR_FIVE.trimH - VPH); // 타일 간 H: 보이는 창 기준 + 트림-창 차이를 더해 실제 슬롯 위치와 일치
  await drawPart(AFront!, X1, Y1, VPW, VPH);
  await drawPart(ABack!, X2, Y1, VPW, VPH);
  await drawPart(BFront!, X1, Y2, VPW, VPH);
  await drawPart(BBack!, X2, Y2, VPW, VPH);

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
        <div style={{ position: 'absolute', left: `${SHEET.outerMarginMm}mm`, top: `${SHEET.outerMarginMm}mm` }}>
          <Slot anchor="top-left" part={AFront ? AFront.part : '4x5-front'} spec={AFront || { part: '4x5-front', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={true} />
        </div>
        <div style={{ position: 'absolute', left: `${SHEET.outerMarginMm + FOUR_FIVE.viewportW + GAP.tileMm}mm`, top: `${SHEET.outerMarginMm}mm` }}>
          <Slot anchor="top-left" part={ABack ? ABack.part : '4x5-back'} spec={ABack || { part: '4x5-back', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={true} />
        </div>
        <div style={{ position: 'absolute', left: `${SHEET.outerMarginMm}mm`, top: `${SHEET.outerMarginMm + FOUR_FIVE.viewportH + GAP.tileMm + (FOUR_FIVE.trimH - FOUR_FIVE.viewportH)}mm` }}>
          <Slot anchor="top-left" part={BFront ? BFront.part : '4x5-front'} spec={BFront || { part: '4x5-front', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={true} />
        </div>
        <div style={{ position: 'absolute', left: `${SHEET.outerMarginMm + FOUR_FIVE.viewportW + GAP.tileMm}mm`, top: `${SHEET.outerMarginMm + FOUR_FIVE.viewportH + GAP.tileMm + (FOUR_FIVE.trimH - FOUR_FIVE.viewportH)}mm` }}>
          <Slot anchor="top-left" part={BBack ? BBack.part : '4x5-back'} spec={BBack || { part: '4x5-back', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={true} />
        </div>
      </Sheet>
    </div>
  );
};

export default FourUp;