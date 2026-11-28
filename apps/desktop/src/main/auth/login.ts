import { shell } from 'electron';
import type { LoginResult } from '../../ipc';
import { exchangeCode, handleFakeLogin, loginPageUrl } from './fake-web';
import { startLoopback, type Loopback } from './loopback-server';
import { challengeFor, createState, createVerifier } from './pkce';
import { saveTokens } from './token-store';

const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

let current: {
  loopback: Loopback;
  reason: 'timeout' | 'cancelled' | null;
} | null = null;

function stop(reason: 'timeout' | 'cancelled') {
  if (!current) return;
  current.reason = reason;
  current.loopback.close();
}

export const cancelLogin = () => stop('cancelled');

export async function login(): Promise<LoginResult> {
  stop('cancelled'); // 로그인을 다시 누르면 이전 임시 서버를 닫고 새로 연다
  const verifier = createVerifier();
  const state = createState();
  const loopback = await startLoopback(state, handleFakeLogin);
  const mine = { loopback, reason: null as 'timeout' | 'cancelled' | null };
  current = mine;
  const timer = setTimeout(
    () => current === mine && stop('timeout'),
    LOGIN_TIMEOUT_MS,
  );

  try {
    await shell.openExternal(
      loginPageUrl({
        port: loopback.port,
        challenge: challengeFor(verifier),
        state,
      }),
    );
    const code = await loopback.code;
    if (!code) return { ok: false, reason: mine.reason ?? 'cancelled' };
    saveTokens(await exchangeCode(code, verifier));
    return { ok: true };
  } catch {
    return { ok: false, reason: 'failed' };
  } finally {
    clearTimeout(timer);
    loopback.close();
    if (current === mine) current = null;
  }
}
