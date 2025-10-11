import { Link } from 'react-router-dom';

const RoleSelect = () => {
  return (
    <div className="page flex flex-col items-center justify-center p-6">
      <div className="card w-full max-w-md p-6 text-center">
        <h1 className="heading text-3xl mb-6">역할 선택</h1>
        <div className="space-y-3">
          <Link to="/p/cd/edit" className="btn btn-primary w-full">CD 참가자 모드</Link>
          <Link to="/p/4x5/edit" className="btn btn-secondary w-full">4×5 참가자 모드</Link>
          <Link to="/s" className="btn btn-outline w-full">스태프 모드</Link>
        </div>
      </div>
    </div>
  );
};

export default RoleSelect;