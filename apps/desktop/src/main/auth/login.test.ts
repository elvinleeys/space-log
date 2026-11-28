import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const opened: string[] = [];
const userData = mkdtempSync(join(tmpdir(), 'spacelog-test-'));

vi.mock('electron', () => ({
  shell: { openExternal: async (url: string) => void opened.push(url) },
  app: { getPath: () => userData },
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (s: string) => Buffer.from(s),
    decryptString: (b: Buffer) => b.toString(),
  },
}));

const { cancelLogin, login } = await import('./login');
const { clearTokens, loadTokens } = await import('./token-store');

/** 브라우저가 열렸을 주소가 나올 때까지 기다린다 */
const openedUrl = () => vi.waitFor(() => new URL(opened.at(-1) ?? ''));

beforeEach(() => {
  opened.length = 0;
  clearTokens();
});

describe('login (로컬 주소로 돌려받기 + PKCE)', () => {
  it('로그인 페이지 → 콜백 → 토큰 교환까지 끝나면 토큰이 저장된다', async () => {
    const result = login();
    const url = await openedUrl();
    expect(url.hostname).toBe('127.0.0.1');
    expect(url.searchParams.get('challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const page = await (await fetch(url)).text();
    const callback = page.match(/href="([^"]+)"/)![1].replaceAll('&amp;', '&');
    expect((await fetch(new URL(callback, url))).status).toBe(200);

    expect(await result).toEqual({ ok: true });
    expect(loadTokens()?.accessToken).toBeTruthy();
    // 끝나면 임시 서버가 닫힌다
    await expect(fetch(url)).rejects.toThrow();
  });

  it('state가 다른 콜백은 받지 않는다', async () => {
    const result = login();
    const url = await openedUrl();
    const bad = await fetch(new URL('/callback?code=x&state=wrong', url));
    expect(bad.status).toBe(400);
    cancelLogin();
    expect(await result).toEqual({ ok: false, reason: 'cancelled' });
    expect(loadTokens()).toBeNull();
  });

  it('가로챈 코드는 검증값이 없어 토큰으로 바꿀 수 없다', async () => {
    const { exchangeCode } = await import('./fake-web');
    const result = login();
    const url = await openedUrl();
    const page = await (await fetch(url)).text();
    const code = new URLSearchParams(
      page.match(/href="[^?]+\?([^"]+)"/)![1].replaceAll('&amp;', '&'),
    ).get('code')!;
    await expect(exchangeCode(code, 'attacker-verifier')).rejects.toThrow();
    cancelLogin();
    await result;
  });

  it('5분 안에 끝내지 않으면 timeout으로 멈춘다', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const result = login();
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(await result).toEqual({ ok: false, reason: 'timeout' });
    vi.useRealTimers();
  });
});
