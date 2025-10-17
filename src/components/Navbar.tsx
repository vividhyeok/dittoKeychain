import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';

const Navbar = () => {
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [editorGroup, setEditorGroup] = useState<string | null>(null);
  const base = 'bg-slate-900/95 backdrop-blur text-white border-b border-white/10';
  const btn = 'btn btn-ghost text-sm';

  const mode: 'pcd' | 'p45' | 'staff' | 'none' =
    pathname.startsWith('/p/cd') ? 'pcd' :
    pathname.startsWith('/p/4x5') ? 'p45' :
    pathname.startsWith('/s') ? 'staff' : 'none';

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ group?: string }>).detail;
      if (detail?.group) setEditorGroup(detail.group);
    };
    window.addEventListener('editor:group-changed', handler as EventListener);
    return () => window.removeEventListener('editor:group-changed', handler as EventListener);
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/p/cd')) {
      if (pathname.includes('/disc')) setEditorGroup('disc');
      else if (pathname.includes('/back')) setEditorGroup('back');
      else setEditorGroup('front');
    } else if (pathname.startsWith('/p/4x5')) {
      if (pathname.includes('/back')) setEditorGroup('back');
      else setEditorGroup('front');
    } else {
      setEditorGroup(null);
    }
  }, [pathname]);

  const triggerComplete = useCallback(() => {
    window.dispatchEvent(new CustomEvent('editor:done'));
  }, []);

  const goToGroup = useCallback((groupKey: string) => {
    if (mode === 'pcd' && !pathname.startsWith('/p/cd/edit')) {
      navigate('/p/cd/edit');
    }
    if (mode === 'p45' && !pathname.startsWith('/p/4x5/edit')) {
      navigate('/p/4x5/edit');
    }
    window.dispatchEvent(new CustomEvent('editor:group', { detail: { group: groupKey } }));
  }, [mode, navigate, pathname]);

  const pillClass = (active: boolean) => active
    ? 'rounded-full bg-white text-slate-900 px-4 py-2 text-sm font-semibold shadow'
    : 'rounded-full px-4 py-2 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 transition';

  let content: React.ReactNode;

  if (mode === 'pcd') {
    const tabs = [
      { key: 'front', label: '앞' },
      { key: 'back', label: '뒤' },
      { key: 'disc', label: 'CD' },
    ];
    const activeKey = editorGroup ?? 'front';
    content = (
      <>
        <div className="flex flex-1 items-center gap-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => goToGroup(tab.key)}
              className={pillClass(activeKey === tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={triggerComplete}
          className="rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/40 transition hover:bg-blue-600"
        >
          완료
        </button>
      </>
    );
  } else if (mode === 'p45') {
    const tabs = [
      { key: 'front', label: '앞' },
      { key: 'back', label: '뒤' },
    ];
    const activeKey = editorGroup ?? 'front';
    content = (
      <>
        <div className="flex flex-1 items-center gap-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => goToGroup(tab.key)}
              className={pillClass(activeKey === tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={triggerComplete}
          className="rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/40 transition hover:bg-blue-600"
        >
          완료
        </button>
      </>
    );
  } else if (mode === 'staff') {
    content = (
      <div className="flex w-full items-center justify-between gap-2">
        <div className="text-sm font-semibold uppercase tracking-wide text-white/70">Staff Tools</div>
        <div className="flex gap-1">
          <Link to="/s/load" className={btn}>불러오기</Link>
          <Link to="/s/4up" className={btn}>4-up</Link>
          <Link to="/s/cd" className={btn}>CD</Link>
          {!isMobile && <Link to="/s/guide" className={btn}>가이드</Link>}
        </div>
      </div>
    );
  } else {
    const homeBtn = 'rounded-full px-3 py-2 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition';
    content = (
      <div className="flex w-full items-center justify-between gap-2">
        <div className="text-base font-semibold tracking-tight text-white">Ditto Keychain</div>
        <div className="flex gap-1">
          <Link to="/p/cd" className={homeBtn}>CD 참가자</Link>
          <Link to="/p/4x5" className={homeBtn}>4×5 참가자</Link>
          <Link to="/p/circle" className={homeBtn}>원형 파트</Link>
          <Link to="/s" className={homeBtn}>스태프</Link>
        </div>
      </div>
    );
  }

  return (
    <nav className={`${base} fixed top-0 left-0 right-0 z-50`}>
      <div className="mx-auto flex w-full max-w-screen-md items-center gap-2 px-3 py-2">
        {content}
      </div>
    </nav>
  );
};

export default Navbar;