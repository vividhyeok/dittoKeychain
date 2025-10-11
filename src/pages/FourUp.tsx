import { useMemo } from 'react';
import Sheet from '../components/Sheet';
import Slot from '../components/Slot';
import { PartSpec } from '../types';
import { staffStore } from '../utils/staffStore';
import { SHEET, GAP, FOUR_FIVE, DPI, mmToPx, EXPORT_NUDGE } from '../utils/printSpecs';

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
    try {
      // 간단 캔버스 렌더링: A6 (100x148mm) @ 300dpi → 1181 x 1748 px 정도. 메모리 고려해 600~900dpi는 피함.
      const dpi = DPI; // 300dpi 기본
      const toPx = (mm: number) => mmToPx(mm, dpi);
      const W = toPx(SHEET.widthMm);
      const H = toPx(SHEET.heightMm);
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
      if (!ctx) return;
  ctx.imageSmoothingEnabled = true;
  // @ts-ignore
  if ('imageSmoothingQuality' in ctx) (ctx as any).imageSmoothingQuality = 'high';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      const failed: string[] = [];
      const loadImage = (src: string) => new Promise<HTMLImageElement | null>((resolve) => {
        const proxied = (() => {
          try {
            const u = new URL(src);
            if (u.origin === window.location.origin || u.origin === 'null') return src; // 같은 출처나 data/blob 등은 그대로
            const p = new URL('/api/proxy', window.location.origin);
            p.searchParams.set('url', src);
            return p.toString();
          } catch {
            return src; // 상대경로 등은 그대로
          }
        })();
        const im = new Image();
        im.crossOrigin = 'anonymous';
        im.onload = () => resolve(im);
        im.onerror = () => resolve(null);
        im.src = proxied;
      });

      const drawPart = async (p: PartSpec | undefined, xMm: number, yMm: number, vpWmm: number, vpHmm: number, label: string) => {
        if (!p?.img) return;
        const x = toPx(xMm), y = toPx(yMm);
        const vpW = toPx(vpWmm), vpH = toPx(vpHmm);
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, vpW, vpH);
        ctx.clip();
        const img = await loadImage(p.img!);
        if (!img) { failed.push(label); ctx.restore(); return; }
        // object-fit: contain + mm 기반 transform 적용
        const txPx = toPx(p.tx), tyPx = toPx(p.ty);
        const scale = p.scale || 1;
        const rW = vpW; const rH = vpH;
        const scaleContain = Math.min(rW / img.width, rH / img.height);
        const drawW = img.width * scaleContain * scale;
        const drawH = img.height * scaleContain * scale;
        // viewport 중앙 정렬
  const imgX = x + (vpW - drawW) / 2 + txPx + toPx(EXPORT_NUDGE.xMm);
  const imgY = y + (vpH - drawH) / 2 + tyPx + toPx(EXPORT_NUDGE.yMm);
        ctx.drawImage(img, imgX, imgY, drawW, drawH);
        ctx.restore();

        // 가이드(트림/세이프) 오버레이: viewport 중심을 기준으로 그리기
        const cx = x + vpW / 2;
        const cy = y + vpH / 2;
        // 트림(빨강, 40x50mm)
        ctx.save();
        ctx.strokeStyle = '#C81E1E';
        ctx.lineWidth = Math.max(1, Math.round(toPx(0.2))); // 약 0.2mm
        const trimW = toPx(FOUR_FIVE.trimW);
        const trimH = toPx(FOUR_FIVE.trimH);
        ctx.strokeRect(cx - trimW / 2, cy - trimH / 2, trimW, trimH);
        ctx.restore();
        // 세이프(파랑 점선, 35x45mm)
        ctx.save();
        ctx.strokeStyle = '#1D4ED8';
        ctx.setLineDash([toPx(1), toPx(1)]);
        ctx.lineWidth = Math.max(1, Math.round(toPx(0.2)));
        ctx.strokeRect(cx - vpW / 2, cy - vpH / 2, vpW, vpH);
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
      await drawPart(AFront, X1, Y1, VPW, VPH, 'A-앞');
      await drawPart(ABack, X2, Y1, VPW, VPH, 'A-뒤');
      await drawPart(BFront, X1, Y2, VPW, VPH, 'B-앞');
      await drawPart(BBack, X2, Y2, VPW, VPH, 'B-뒤');

      // toDataURL 시 CORS로 캔버스가 오염되면 예외가 발생할 수 있음
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/jpeg', 0.92);
      a.download = 'fourup-a6.jpg';
      a.click();

      if (failed.length > 0) {
        window.setTimeout(() => {
          alert(`일부 이미지를 불러오지 못했습니다 (CORS 미허용 등):\n- ${failed.join('\n- ')}\n\n해결 방법:\n1) 참가자 에디터에서 '이미지 붙여넣기/파일 업로드'로 불러오면 내부 데이터로 저장되어 정상 내보내기 됩니다.\n2) 또는 브라우저 인쇄(미리보기)로 PDF 저장을 사용하세요.`);
        }, 0);
      }
    } catch (e) {
      console.error(e);
      alert('이미지로 저장 중 오류가 발생했습니다. 원본 이미지 서버가 CORS를 허용하지 않으면 저장이 차단될 수 있습니다.\n- 참가자 쪽에서 이미지 붙여넣기/파일 업로드로 다시 저장하거나, 인쇄(PDF) 저장을 사용하세요.');
    }
  };

  return (
    <div className="page p-4">
  <div className="card p-4 mb-3 no-print">
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