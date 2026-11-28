import { useEffect, useRef } from 'react';
import { useSession } from '@/features/login';
import { CapturePage } from '@/pages/capture';
import { CollectorPage } from '@/pages/collector';
import { LoginPage } from '@/pages/login';
import { ipc } from '@/shared/ipc';

export function App() {
  // 영역 캡처용 덮개 창은 같은 화면 코드를 #capture 로 연다
  if (window.location.hash === '#capture') return <CapturePage />;
  return <CollectorShell />;
}

function CollectorShell() {
  const session = useSession();
  const box = useRef<HTMLDivElement>(null);

  // 창 크기를 내용 크기에 맞춘다. 창이 내용만큼만 차지해야 주변을 누를 때 뒤 창이 눌린다
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(() =>
      ipc.resizeWindow(el.offsetWidth, el.offsetHeight),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={box}
      className="inline-flex w-max shrink-0 flex-col items-end gap-3 p-4"
    >
      {session.status === 'loggedIn' ? (
        <CollectorPage onLogout={session.logout} />
      ) : (
        <LoginPage session={session} />
      )}
    </div>
  );
}
