import { Link } from 'react-router-dom';

const StaffHome = () => {
  return (
    <div className="page flex flex-col items-center justify-center p-6">
      <div className="card w-full max-w-md p-6 text-center">
        <h1 className="heading mb-2">스태프 모드</h1>
        <p className="subheading mb-6">인쇄와 스캔, 배치 작업 전용</p>
        <div className="space-y-3">
          <Link to="/s/load" className="btn btn-primary w-full">이미지 불러오기</Link>
          <Link to="/s/4up" className="btn btn-secondary w-full">4-up 배치/인쇄</Link>
          <Link to="/s/cd" className="btn btn-secondary w-full">CD 3-up 배치/인쇄</Link>
          <Link to="/s/guide" className="btn btn-outline w-full">가이드/테스트</Link>
        </div>
      </div>
    </div>
  );
};

export default StaffHome;