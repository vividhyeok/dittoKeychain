import { Link, useLocation } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';

const Navbar = () => {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const base = 'bg-slate-900/95 backdrop-blur text-white border-b border-white/10';
  const btn = 'btn btn-ghost text-sm';

  const mode: 'pcd' | 'p45' | 'staff' | 'none' =
    pathname.startsWith('/p/cd') ? 'pcd' :
    pathname.startsWith('/p/4x5') ? 'p45' :
    pathname.startsWith('/s') ? 'staff' : 'none';

  return (
    <nav className={`${base} fixed top-0 left-0 right-0 z-50`}> 
      <div className="max-w-screen-xl mx-auto flex items-center justify-between px-3 py-2">
        <Link to="/" className="font-bold tracking-tight">Ditto Keychain</Link>
        {/* 컨텍스트 전용 내비게이션 */}
        {mode === 'pcd' && (
          <div className="flex gap-1">
            <Link to="/p/cd" className={btn}>CD 홈</Link>
            <Link to="/p/cd/edit" className={btn}>편집</Link>
          </div>
        )}
        {mode === 'p45' && (
          <div className="flex gap-1">
            <Link to="/p/4x5" className={btn}>4×5 홈</Link>
            <Link to="/p/4x5/edit" className={btn}>편집</Link>
          </div>
        )}
        {mode === 'staff' && (
          <div className="flex gap-1">
            <Link to="/s/load" className={btn}>불러오기</Link>
            <Link to="/s/4up" className={btn}>4-up</Link>
            <Link to="/s/cd" className={btn}>CD</Link>
            {!isMobile && <Link to="/s/guide" className={btn}>가이드</Link>}
          </div>
        )}
        {mode === 'none' && (
          <div className="flex gap-1">
            <Link to="/p/cd" className={btn}>CD 참가자</Link>
            <Link to="/p/4x5" className={btn}>4×5 참가자</Link>
            <Link to="/s" className={btn}>스태프</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;