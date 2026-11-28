import { describe, expect, it } from 'vitest';
import { CollectError, collectRecord } from './collect-record';

const baseUrl = 'https://web.test';
const record = { record_id: 'r1', status: 'uploading' };
const upload = (n: number) => ({
  file_id: `f${n}`,
  position: n,
  path: `u/r1/f${n}.txt`,
  token: 't',
  signedUrl: `https://storage.test/upload/f${n}?token=t`,
  contentType: 'text/plain',
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

/** 부른 순서를 기억하는 가짜 fetch. 주소에 맞는 응답을 돌려준다 */
function fakeFetch(routes: Record<string, () => Response>) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, init });
    const key = Object.keys(routes).find((k) => url.includes(k));
    if (!key) throw new Error(`가짜 응답이 없음: ${url}`);
    return routes[key]();
  }) as typeof globalThis.fetch;
  return { fetch, calls };
}

const memo = {
  record_type: 'memo',
  collected_from: 'desktop',
  information_content: '메모',
} as const;
const fileRequest = {
  record_type: 'file',
  collected_from: 'desktop',
  files: [
    { name: 'a.txt', size: 1 },
    { name: 'b.txt', size: 1 },
  ],
} as const;
const blobs = [new Blob(['a']), new Blob(['b'])];

describe('collectRecord', () => {
  it('파일 없는 기록은 생성 요청 한 번으로 끝난다', async () => {
    const { fetch, calls } = fakeFetch({
      '/api/records': () =>
        json(
          { record: { ...record, status: 'queued' }, files: [], uploads: [] },
          201,
        ),
    });
    const saved = await collectRecord({ ...memo }, [], {
      baseUrl,
      accessToken: 'token',
      fetch,
    });
    expect(saved.status).toBe('queued');
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://web.test/api/records');
    expect(calls[0].init.headers).toMatchObject({
      Authorization: 'Bearer token',
    });
  });

  it('파일 기록은 생성 → 파일마다 PUT → 완료 알림 순서로 보낸다', async () => {
    const { fetch, calls } = fakeFetch({
      '/uploaded': () => json({ record: { ...record, status: 'queued' } }),
      '/api/records': () =>
        json({ record, files: [], uploads: [upload(1), upload(2)] }, 201),
      'storage.test': () => json({}),
    });
    const saved = await collectRecord(
      { ...fileRequest, files: [...fileRequest.files] },
      blobs,
      { baseUrl, fetch },
    );
    expect(saved.status).toBe('queued');
    expect(calls.map((c) => `${c.init.method} ${c.url}`)).toEqual([
      'POST https://web.test/api/records',
      'PUT https://storage.test/upload/f1?token=t',
      'PUT https://storage.test/upload/f2?token=t',
      'POST https://web.test/api/records/r1/uploaded',
    ]);
    expect(calls[1].init.body).toBe(blobs[0]);
    expect(calls[1].init.headers).toEqual({ 'Content-Type': 'text/plain' });
  });

  it('서버가 거절하면 그 오류 코드를 전한다', async () => {
    const { fetch } = fakeFetch({
      '/api/records': () =>
        json(
          { error: { code: 'UNAUTHORIZED', message: '로그인이 필요해요' } },
          401,
        ),
    });
    await expect(
      collectRecord({ ...memo }, [], { baseUrl, fetch }),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: '로그인이 필요해요',
    });
  });

  it('업로드가 실패하면 완료 알림을 보내지 않고, 만든 기록의 id를 알려 준다', async () => {
    const { fetch, calls } = fakeFetch({
      '/api/records': () =>
        json({ record, files: [], uploads: [upload(1), upload(2)] }, 201),
      'storage.test': () => json({}, 500),
    });
    const error = await collectRecord(
      { ...fileRequest, files: [...fileRequest.files] },
      blobs,
      { baseUrl, fetch },
    ).catch((e) => e);
    expect(error).toBeInstanceOf(CollectError);
    expect(error).toMatchObject({ code: 'UPLOAD_FAILED', recordId: 'r1' });
    expect(calls.some((c) => c.url.includes('/uploaded'))).toBe(false);
  });

  it('검사에 걸리는 요청과 파일 개수가 다른 요청은 보내지 않는다', async () => {
    const { fetch, calls } = fakeFetch({});
    await expect(
      collectRecord({ ...memo, information_content: ' ' }, [], {
        baseUrl,
        fetch,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    await expect(
      collectRecord(
        { ...fileRequest, files: [...fileRequest.files] },
        [blobs[0]],
        {
          baseUrl,
          fetch,
        },
      ),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    expect(calls).toHaveLength(0);
  });

  it('서버에 닿지 못하면 NETWORK_ERROR', async () => {
    const fetch = (async () => {
      throw new TypeError('fetch failed');
    }) as typeof globalThis.fetch;
    await expect(
      collectRecord({ ...memo }, [], { baseUrl, fetch }),
    ).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });
});
