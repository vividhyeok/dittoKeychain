// components/PrintLayout/ExportButtons.tsx
import React from 'react';
import jsPDF from 'jspdf';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - svg2pdf types are partial; use named import
import { svg2pdf } from 'svg2pdf.js';

type ExportButtonsProps = {
  svgRef: React.RefObject<SVGSVGElement>;
  filename: string;
};

export default function ExportButtons({ svgRef, filename }: ExportButtonsProps) {
  const exportPNG = async () => {
    const svg = svgRef.current;
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `${filename}.png`;
      link.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const exportPDF = async () => {
    const svg = svgRef.current;
    if (!svg) return;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    // ViewBox를 기반으로 mm 크기 계산 (현재 mmToPx 사용으로 width/height가 px)
    // A4 전체에 맞춰 렌더링
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await svg2pdf(svg, pdf, { x: 0, y: 0, width: 210, height: 297 });
    pdf.save(`${filename}.pdf`);
  };

  return (
    <div className="flex gap-2 mt-4">
      <button onClick={exportPNG} className="btn btn-primary">PNG 내보내기</button>
      <button onClick={exportPDF} className="btn btn-primary">PDF 내보내기</button>
    </div>
  );
}