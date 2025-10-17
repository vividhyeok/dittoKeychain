import React, { useRef, useState } from 'react';
import type { PartSpec } from '../types';
import BackFoldStrip from '../components/Preview/BackFoldStrip';

const EditCdBackFold: React.FC = () => {
  const initial: Record<string, PartSpec> = {
    'cd-back-outside': { part: 'cd-back-outside', img: '', tx: 0, ty: 0, scale: 1, rot: 0 },
    'cd-spine-1': { part: 'cd-spine-1', img: '', tx: 0, ty: 0, scale: 1, rot: 0 },
    'cd-spine-2': { part: 'cd-spine-2', img: '', tx: 0, ty: 0, scale: 1, rot: 0 },
    'cd-spine-3': { part: 'cd-spine-3', img: '', tx: 0, ty: 0, scale: 1, rot: 0 },
    'cd-back-inside': { part: 'cd-back-inside', img: '', tx: 0, ty: 0, scale: 1, rot: 0 },
  };
  const [specs, setSpecs] = useState<Record<string, PartSpec>>(initial);
  const svgRef = useRef<SVGSVGElement>(null);

  const onFilePick = (key: string, file?: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSpecs((prev) => ({ ...prev, [key]: { ...prev[key], img: url } }));
  };

  return (
    <div className="p-4">
      {/* 상단: 한 줄 미리보기 */}
      <div className="border rounded p-2 overflow-auto" style={{ background: '#fafafa' }}>
        <BackFoldStrip ref={svgRef} specs={specs} />
      </div>

      {/* 하단: 각 패널별 이미지 선택 버튼들 */}
      <div className="mt-4 grid grid-cols-5 gap-3">
        {[
          { key: 'cd-back-outside', label: 'outside' },
          { key: 'cd-spine-1', label: 'spine 1' },
          { key: 'cd-spine-2', label: 'spine 2' },
          { key: 'cd-spine-3', label: 'spine 3' },
          { key: 'cd-back-inside', label: 'inside' },
        ].map(({ key, label }) => (
          <label key={key} className="flex flex-col items-start gap-2 text-sm">
            <span className="text-slate-600">{label}</span>
            <input type="file" accept="image/*" onChange={(e) => onFilePick(key, e.target.files?.[0])} />
          </label>
        ))}
      </div>
    </div>
  );
};

export default EditCdBackFold;
