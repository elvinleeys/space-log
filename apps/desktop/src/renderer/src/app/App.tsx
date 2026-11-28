import { useEffect, useRef, useState } from 'react';
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

  // 메뉴·저장 창이 열리는 방향. 캐릭터가 화면 왼쪽·위쪽에 있으면 main이 뒤집으라고 알려 준다
  const [left, setLeft] = useState(false);
  const [top, setTop] = useState(false);
  useEffect(
    () =>
      ipc.onPanelSide((side) => {
        setLeft(side.left);
        setTop(side.top);
      }),
    [],
  );

  // 창 크기를 내용 크기에 맞춘다. 창이 내용만큼만 차지해야 주변을 누를 때 뒤 창이 눌린다.
  // 캐릭터 칸의 자리도 함께 알려, 창이 커져도 캐릭터가 화면에서 움직이지 않게 한다
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const c = el.querySelector<HTMLElement>('[data-character]');
      if (!c) return;
      ipc.resizeWindow({
        width: el.offsetWidth,
        height: el.offsetHeight,
        anchorX: c.offsetLeft + c.offsetWidth,
        anchorY: c.offsetTop + c.offsetHeight,
        baseWidth: c.offsetWidth,
        baseHeight: c.offsetHeight,
        pad: parseFloat(getComputedStyle(el).paddingTop),
      });
    });
    // 방향이 바뀌면 크기는 같아도 캐릭터 자리가 달라지므로 다시 지켜봐서 한 번 더 알린다
    observer.observe(el);
    return () => observer.disconnect();
  }, [left, top]);

  return (
    <div
      ref={box}
      className={`relative inline-flex w-max shrink-0 gap-3 p-5 ${top ? 'flex-col-reverse' : 'flex-col'} ${left ? 'items-start' : 'items-end'}`}
    >
      {session.status === 'loggedIn' ? (
        <CollectorPage onLogout={session.logout} />
      ) : (
        <LoginPage session={session} />
      )}
    </div>
  );
}
