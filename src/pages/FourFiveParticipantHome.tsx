import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

const FourFiveParticipantHome = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const q = searchParams.toString();
    navigate(`/p/4x5/edit${q ? `?${q}` : ''}`, { replace: true });
  }, [searchParams, navigate]);

  return (
    <div className="page flex flex-col items-center justify-center p-6">
      <div className="text-slate-300">이동 중…</div>
    </div>
  );
};

export default FourFiveParticipantHome;