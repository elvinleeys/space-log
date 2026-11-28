import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock은 파일 맨 위로 끌어올려지므로, 가짜 함수도 함께 끌어올린다
const { compress, readPickedFile } = vi.hoisted(() => ({
  compress: vi.fn(),
  readPickedFile: vi.fn(),
}));
vi.mock('@space-log/shared', async (original) => ({
  ...(await original<typeof import('@space-log/shared')>()),
  compressImageIfNeeded: compress,
}));
vi.mock('@/shared/ipc', () => ({ ipc: { readPickedFile } }));

import { shrinkIfLarge, shrinkLargeImages } from '.';

const MB = 1024 * 1024;
const small = new File(['줄인 그림'], '사진.jpg', { type: 'image/jpeg' });

beforeEach(() => {
  compress.mockReset();
  readPickedFile.mockReset();
});

describe('큰 이미지 줄이기', () => {
  it('10MB 이하 파일과 이미지가 아닌 큰 파일은 건드리지 않는다', async () => {
    const files = [
      { name: '작은.png', size: 2 * MB, path: '/a/작은.png' },
      { name: '큰.pdf', size: 12 * MB, path: '/a/큰.pdf' },
    ];
    expect(await shrinkLargeImages(files)).toEqual(files);
    expect(compress).not.toHaveBeenCalled();
    expect(readPickedFile).not.toHaveBeenCalled();
  });

  it('10MB가 넘는 png는 줄인 jpg로 바꾼다 (끌어다 놓은 파일)', async () => {
    compress.mockResolvedValue({ ok: true, compressed: true, file: small });
    const blob = new Blob(['원본']);
    const result = await shrinkIfLarge({
      name: '사진.png',
      size: 12 * MB,
      path: '/a/사진.png',
      blob,
    });
    expect(result).toEqual({
      name: '사진.jpg',
      size: small.size,
      blob: small,
      path: undefined,
      dataUrl: undefined,
    });
    expect(readPickedFile).not.toHaveBeenCalled();
  });

  it('파일선택으로 고른 파일은 main에서 내용을 읽어 줄인다', async () => {
    readPickedFile.mockResolvedValue(new Uint8Array([1, 2, 3]));
    compress.mockResolvedValue({ ok: true, compressed: true, file: small });
    const result = await shrinkIfLarge({
      name: '사진.JPG',
      size: 15 * MB,
      path: '/a/사진.JPG',
    });
    expect(readPickedFile).toHaveBeenCalledWith('/a/사진.JPG');
    expect(result.name).toBe('사진.jpg');
    expect(result.size).toBe(small.size);
  });

  it('줄여도 10MB를 넘거나 읽지 못하면 원래 파일을 그대로 둔다', async () => {
    const entry = { name: '사진.png', size: 12 * MB, blob: new Blob(['x']) };
    compress.mockResolvedValue({ ok: false, reason: 'STILL_TOO_LARGE' });
    expect(await shrinkIfLarge(entry)).toBe(entry);
    compress.mockRejectedValue(new Error('그림이 아님'));
    expect(await shrinkIfLarge(entry)).toBe(entry);
    const picked = { name: '사진.png', size: 12 * MB, path: '/a/사진.png' };
    readPickedFile.mockRejectedValue(new Error('고르지 않은 파일'));
    expect(await shrinkIfLarge(picked)).toBe(picked);
  });
});
