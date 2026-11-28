import type { Session } from '@/features/login';
import { TEXT } from '@/shared/config';
import { ipc } from '@/shared/ipc';
import { Button, Card } from '@/shared/ui';
import { Character } from '@/widgets/character';

/** 로그인 전에는 수집 기능 대신 로그인 안내를 보여 준다. 로그인은 웹에서 한다 */
export function LoginPage({ session }: { session: Session }) {
  const waiting = session.status === 'waiting';
  return (
    <>
      {session.status !== 'loading' && (
        <Card className="flex flex-col gap-3 p-4">
          <p className="text-wordmark font-semibold">SPACELOG</p>
          <p className="text-ink-sub">
            {waiting ? TEXT.login.waiting : TEXT.login.guide}
          </p>
          {session.error && (
            <p className="text-ink-sub text-fine">
              {TEXT.login[session.error]}
            </p>
          )}
          {waiting ? (
            <Button size="lg" onClick={session.cancel}>
              {TEXT.login.cancel}
            </Button>
          ) : (
            <Button variant="primary" size="lg" onClick={session.login}>
              {TEXT.login.button}
            </Button>
          )}
          <button
            type="button"
            onClick={ipc.quit}
            className="text-ink-off hover:text-ink-sub text-fine self-end"
          >
            {TEXT.menu.quit}
          </button>
        </Card>
      )}
      <Character />
    </>
  );
}
