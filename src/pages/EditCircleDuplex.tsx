// pages/EditCircleDuplex.tsx
import React, { useState, useRef } from 'react';
import PrintSheetSVG from '../components/PrintLayout/PrintSheetSVG';
import ExportButtons from '../components/PrintLayout/ExportButtons';
import { Config } from '../types/config';

const EditCircleDuplex: React.FC = () => {
  // 기본 설정
  const defaultCfg: Config = {
    units: 'mm',
    scale: 1.0,
    defaults: {
      fit: 'cover',
      safe_mm: 2,
      bleed_mm: 1,
      paper_thickness_mm: 0.3,
    },
    part: {
      type: 'circle_duplex',
      outer_diameter_mm: 38,
      images: {
        front: { src: '', fit: 'cover' },
        back: { src: '', fit: 'cover', flipXOnBack: true },
      },
      perforation: {
        shape: 'cross',
        half_arm_mm: 7,
        arm_width_mm: 1,
        dash_mm: 0.6,
        gap_mm: 0.4,
      },
      safe_mm: 2,
      bleed_mm: 1,
    },
    print: {
      page: { w_mm: 210, h_mm: 297, margin_mm: 8 },
      grid: { cols: 4, rows: 5, spacing_mm: 6 },
      registration_marks: true,
      show_cut_lines: true,
      show_safe_bleed: false,
    },
  };

  const [cfg, setCfg] = useState<Config>(defaultCfg);
  const frontSvgRef = useRef<SVGSVGElement>(null);
  const backSvgRef = useRef<SVGSVGElement>(null);

  // 간단한 이미지 업로드 시뮬레이션 (실제로는 파일 입력)
  const handleImageUpload = (side: 'front' | 'back', file: File) => {
    const url = URL.createObjectURL(file);
    setCfg(prev => ({
      ...prev,
      part: {
        ...prev.part,
        images: {
          ...prev.part.images,
          [side]: { ...prev.part.images[side], src: url },
        },
      },
    }));
  };

  return (
    <div className="page p-4">
      <h1 className="text-xl font-bold mb-4">양면 원형 파트 편집</h1>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">이미지 업로드</h2>
            <p className="mt-2 text-sm text-slate-500">38mm 양면 디스크에 맞춰 앞·뒤 이미지를 업로드하세요. 뒷면은 자동으로 좌우를 맞춰줍니다.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm font-semibold text-slate-600 transition hover:border-blue-400 hover:text-blue-600">
                <span>앞면 이미지</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleImageUpload('front', e.target.files[0])}
                  className="text-xs font-normal text-slate-500"
                />
              </label>
              <label className="flex flex-col gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm font-semibold text-slate-600 transition hover:border-blue-400 hover:text-blue-600">
                <span>뒷면 이미지</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleImageUpload('back', e.target.files[0])}
                  className="text-xs font-normal text-slate-500"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">원형 미리보기</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                { label: '앞면', src: cfg.part.images.front.src },
                { label: '뒷면', src: cfg.part.images.back.src },
              ].map(({ label, src }) => (
                <div key={label} className="flex flex-col items-center gap-3">
                  <div className="text-sm font-medium text-slate-600">{label}</div>
                  <div className="relative h-40 w-40 overflow-hidden rounded-full border border-slate-200 bg-slate-50 shadow-inner">
                    {src ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${src})` }}
                        aria-label={`${label} 이미지 미리보기`}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">이미지를 업로드하세요</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex-1 space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">앞면 인쇄</h2>
            <div className="mt-4 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <PrintSheetSVG ref={frontSvgRef} cfg={cfg} side="front" />
            </div>
            <ExportButtons svgRef={frontSvgRef} filename="circle-duplex-front" />
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">뒷면 인쇄</h2>
            <div className="mt-4 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <PrintSheetSVG ref={backSvgRef} cfg={cfg} side="back" />
            </div>
            <ExportButtons svgRef={backSvgRef} filename="circle-duplex-back" />
          </section>
        </div>
      </div>
    </div>
  );
};

export default EditCircleDuplex;