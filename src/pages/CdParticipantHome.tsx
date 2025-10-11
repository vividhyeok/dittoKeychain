import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

const CdParticipantHome = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const q = searchParams.toString();
    navigate(`/p/cd/edit${q ? `?${q}` : ''}`, { replace: true });
  }, [searchParams, navigate]);

  return (
    <div className="page flex flex-col items-center justify-center p-6">
      <div className="text-slate-300">이동 중…</div>
    </div>
  );
};

export default CdParticipantHome;