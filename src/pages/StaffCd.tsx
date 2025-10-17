import Sheet from '../components/Sheet';
import Slot from '../components/Slot';
import { staffStore } from '../utils/staffStore';
import Preview3D from '../components/Preview3D';
import React from 'react';
import { SHEET, GAP, CD } from '../utils/printSpecs';

const StaffCd = () => {
  const cd = staffStore.getCd();
  const [show3d, setShow3d] = React.useState(false);
  return (
    <div className="page p-4">
  <div className="card p-4 mb-3 no-print">
        <div className="flex items-center justify-between">
          <h1 className="heading">CD 3-up 배치/인쇄</h1>
          <div className="flex gap-2">
            <button onClick={() => setShow3d(true)} className="btn btn-outline">3D 미리보기</button>
            <button onClick={() => window.print()} className="btn btn-primary">바로 인쇄</button>
          </div>
        </div>
      </div>
      <Sheet responsive origin="top-left">
        {/* 1행: 디스크 */}
        <div style={{ position: 'absolute', left: `${SHEET.outerMarginMm}mm`, top: `${SHEET.outerMarginMm}mm` }}>
          <Slot anchor="top-left" part="cd-disc" spec={cd?.disc || { part: 'cd-disc', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={true} />
        </div>

        {/* 2행: 앞면(좌/우) 40x40 + 40x40 */}
        <div style={{ position: 'absolute', left: `${SHEET.outerMarginMm}mm`, top: `${SHEET.outerMarginMm + CD.disc.bleedD + GAP.tileMm}mm` }}>
          <Slot anchor="top-left" part="cd-front-left" spec={cd?.frontPanels?.left || { part: 'cd-front-left', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={true} />
        </div>
        <div style={{ position: 'absolute', left: `${SHEET.outerMarginMm + CD.panels.front.left.w + GAP.tileMm}mm`, top: `${SHEET.outerMarginMm + CD.disc.bleedD + GAP.tileMm}mm` }}>
          <Slot anchor="top-left" part="cd-front-right" spec={cd?.frontPanels?.right || { part: 'cd-front-right', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={true} />
        </div>

        {/* 3행: 뒷면(5패널) 49 | 5 | 5 | 5 | 44 (높이 37) */}
        <div style={{ position: 'absolute', left: `${SHEET.outerMarginMm}mm`, top: `${SHEET.outerMarginMm + CD.disc.bleedD + GAP.tileMm + CD.panels.front.left.h + GAP.tileMm}mm` }}>
          <Slot anchor="top-left" part="cd-back-outside" spec={cd?.backPanels?.outside || { part: 'cd-back-outside', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={true} />
        </div>
        <div style={{ position: 'absolute', left: `${SHEET.outerMarginMm + CD.panels.back.outside.w + GAP.tileMm}mm`, top: `${SHEET.outerMarginMm + CD.disc.bleedD + GAP.tileMm + CD.panels.front.left.h + GAP.tileMm}mm` }}>
          <Slot anchor="top-left" part="cd-spine-1" spec={cd?.backPanels?.spine1 || { part: 'cd-spine-1', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={true} />
        </div>
        <div style={{ position: 'absolute', left: `${SHEET.outerMarginMm + CD.panels.back.outside.w + GAP.tileMm + CD.panels.back.spine1.w + GAP.tileMm}mm`, top: `${SHEET.outerMarginMm + CD.disc.bleedD + GAP.tileMm + CD.panels.front.left.h + GAP.tileMm}mm` }}>
          <Slot anchor="top-left" part="cd-spine-2" spec={cd?.backPanels?.spine2 || { part: 'cd-spine-2', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={true} />
        </div>
        <div style={{ position: 'absolute', left: `${SHEET.outerMarginMm + CD.panels.back.outside.w + GAP.tileMm + CD.panels.back.spine1.w + GAP.tileMm + CD.panels.back.spine2.w + GAP.tileMm}mm`, top: `${SHEET.outerMarginMm + CD.disc.bleedD + GAP.tileMm + CD.panels.front.left.h + GAP.tileMm}mm` }}>
          <Slot anchor="top-left" part="cd-spine-3" spec={cd?.backPanels?.spine3 || { part: 'cd-spine-3', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={true} />
        </div>
        <div style={{ position: 'absolute', left: `${SHEET.outerMarginMm + CD.panels.back.outside.w + GAP.tileMm + CD.panels.back.spine1.w + GAP.tileMm + CD.panels.back.spine2.w + GAP.tileMm + CD.panels.back.spine3.w + GAP.tileMm}mm`, top: `${SHEET.outerMarginMm + CD.disc.bleedD + GAP.tileMm + CD.panels.front.left.h + GAP.tileMm}mm` }}>
          <Slot anchor="top-left" part="cd-back-inside" spec={cd?.backPanels?.inside || { part: 'cd-back-inside', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={true} />
        </div>
      </Sheet>
      {show3d && (
        <Preview3D specs={{
          'cd-disc': cd?.disc || { part: 'cd-disc', tx:0,ty:0,scale:1,rot:0 },
          'cd-front-left': cd?.frontPanels?.left || { part: 'cd-front-left', tx:0,ty:0,scale:1,rot:0 },
          'cd-front-right': cd?.frontPanels?.right || { part: 'cd-front-right', tx:0,ty:0,scale:1,rot:0 },
          'cd-back-outside': cd?.backPanels?.outside || { part: 'cd-back-outside', tx:0,ty:0,scale:1,rot:0 },
          'cd-spine-1': cd?.backPanels?.spine1 || { part: 'cd-spine-1', tx:0,ty:0,scale:1,rot:0 },
          'cd-spine-2': cd?.backPanels?.spine2 || { part: 'cd-spine-2', tx:0,ty:0,scale:1,rot:0 },
          'cd-spine-3': cd?.backPanels?.spine3 || { part: 'cd-spine-3', tx:0,ty:0,scale:1,rot:0 },
          'cd-back-inside': cd?.backPanels?.inside || { part: 'cd-back-inside', tx:0,ty:0,scale:1,rot:0 },
        }} onClose={() => setShow3d(false)} />
      )}
      
    </div>
  );
};

export default StaffCd;
