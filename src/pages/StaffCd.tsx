import Sheet from '../components/Sheet';
import Slot from '../components/Slot';
import { staffStore } from '../utils/staffStore';

const StaffCd = () => {
  const cd = staffStore.getCd();
  return (
    <div className="page p-4">
      <div className="card p-4 mb-3">
        <div className="flex items-center justify-between">
          <h1 className="heading">CD 3-up 배치/인쇄</h1>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="btn btn-primary">바로 인쇄</button>
          </div>
        </div>
      </div>
      <Sheet responsive origin="top-left">
        <div style={{ position: 'absolute', left: '2mm', top: '2mm' }}>
          <Slot anchor="top-left" part="cd-disc" spec={cd?.disc || { part: 'cd-disc', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={true} />
        </div>
        <div style={{ position: 'absolute', left: '2mm', top: '48mm' }}>
          <Slot anchor="top-left" part="case-front" spec={cd?.front || { part: 'case-front', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={true} />
        </div>
        <div style={{ position: 'absolute', left: '2mm', top: '94mm' }}>
          <Slot anchor="top-left" part="case-back" spec={cd?.back || { part: 'case-back', tx: 0, ty: 0, scale: 1, rot: 0 }} onUpdate={() => {}} showGuides={true} />
        </div>
      </Sheet>
      
    </div>
  );
};

export default StaffCd;
