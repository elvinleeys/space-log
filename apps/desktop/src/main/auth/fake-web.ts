// 가짜 웹 로그인. 웹 로그인 페이지와 토큰 교환 서버가 생기면 이 파일의 loginPageUrl, exchangeCode만 실제 구현으로 바꾼다.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomBytes } from 'node:crypto';
import { challengeFor } from './pkce';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

// 가짜 로그인 페이지가 내준 코드와, 그때 받은 확인값
const issued = new Map<string, string>();

/** 브라우저로 열 로그인 페이지 주소. 포트, 확인값, state를 넘긴다 */
export function loginPageUrl(p: {
  port: number;
  challenge: string;
  state: string;
}): string {
  const q = new URLSearchParams({
    port: String(p.port),
    challenge: p.challenge,
    state: p.state,
  });
  return `http://127.0.0.1:${p.port}/fake-login?${q}`;
}

/** 임시 서버가 대신 내주는 가짜 로그인 페이지. 실제로는 웹의 로그인 페이지가 이 자리를 맡는다 */
export function handleFakeLogin(
  _req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): boolean {
  if (url.pathname !== '/fake-login') return false;
  const code = randomBytes(16).toString('base64url');
  issued.set(code, url.searchParams.get('challenge') ?? '');
  const callback = `/callback?${new URLSearchParams({ code, state: url.searchParams.get('state') ?? '' })}`;
  res.end(
    `<!doctype html><meta charset="utf-8"><title>Spacelog 로그인 (가짜)</title>` +
      `<h1>Spacelog 로그인</h1>` +
      `<p>개발용 가짜 로그인 페이지예요. 실제로는 Spacelog 웹의 로그인 페이지가 열려요.</p>` +
      `<p><a href="${callback}">로그인</a></p>`,
  );
  return true;
}

/** 일회용 코드와 PKCE 검증값을 토큰으로 바꾼다 */
export async function exchangeCode(
  code: string,
  verifier: string,
): Promise<Tokens> {
  const challenge = issued.get(code);
  issued.delete(code);
  if (!challenge || challengeFor(verifier) !== challenge)
    throw new Error('코드 확인 실패');
  return {
    accessToken: `fake-access-${code}`,
    refreshToken: `fake-refresh-${code}`,
  };
}
