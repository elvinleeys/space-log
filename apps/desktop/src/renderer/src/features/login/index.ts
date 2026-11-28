import { useCallback, useEffect, useState } from 'react';
import { ipc } from '@/shared/ipc';

export interface Session {
  status: 'loading' | 'loggedOut' | 'waiting' | 'loggedIn';
  /** 직전 로그인이 끝나지 못한 이유 */
  error: 'timeout' | 'failed' | null;
  login(): void;
  cancel(): void;
  logout(): void;
}

export function useSession(): Session {
  const [status, setStatus] = useState<Session['status']>('loading');
  const [error, setError] = useState<Session['error']>(null);

  useEffect(() => {
    ipc
      .authStatus()
      .then((s) => setStatus(s.loggedIn ? 'loggedIn' : 'loggedOut'));
  }, []);

  const login = useCallback(async () => {
    setError(null);
    setStatus('waiting');
    const result = await ipc.login();
    if (result.ok) return setStatus('loggedIn');
    setStatus('loggedOut');
    if (result.reason !== 'cancelled') setError(result.reason);
  }, []);

  const logout = useCallback(async () => {
    await ipc.logout();
    setStatus('loggedOut');
  }, []);

  // 트레이 메뉴의 로그인. 로그인 상태는 여기 한 곳에서만 바꾼다
  useEffect(
    () =>
      ipc.onLoginRequest(() => {
        if (status === 'loggedOut') login();
      }),
    [status, login],
  );

  // cancel은 호출 시점에 브릿지를 읽도록 감싼다
  const cancel = useCallback(() => ipc.cancelLogin(), []);
  return { status, error, login, cancel, logout };
}
