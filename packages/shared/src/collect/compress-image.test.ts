import { describe, expect, it } from 'vitest';
import {
  compressedFileName,
  fitWithin,
  needsCompression,
} from './compress-image';

const MB = 1024 * 1024;

describe('needsCompression', () => {
  it('10MB를 넘는 jpg·jpeg·png만 줄인다', () => {
    expect(needsCompression('a.PNG', 10 * MB + 1)).toBe(true);
    expect(needsCompression('a.jpeg', 20 * MB)).toBe(true);
    expect(needsCompression('a.png', 10 * MB)).toBe(false);
  });

  it('PDF·svg·글 파일은 크더라도 줄이지 않는다', () => {
    for (const name of ['a.pdf', 'a.svg', 'a.txt'])
      expect(needsCompression(name, 20 * MB)).toBe(false);
  });
});

describe('fitWithin', () => {
  it('긴 변을 4096px 이하로 비율 유지', () => {
    expect(fitWithin(8192, 4096)).toEqual({ width: 4096, height: 2048 });
    expect(fitWithin(3000, 6000)).toEqual({ width: 2048, height: 4096 });
  });

  it('이미 작으면 그대로', () => {
    expect(fitWithin(1920, 1080)).toEqual({ width: 1920, height: 1080 });
  });

  it('아주 가는 이미지도 1px 이상', () => {
    expect(fitWithin(100000, 1)).toEqual({ width: 4096, height: 1 });
  });
});

describe('compressedFileName', () => {
  it('확장자를 .jpg로 바꾼다', () => {
    expect(compressedFileName('우주기록 시안.png')).toBe('우주기록 시안.jpg');
    expect(compressedFileName('photo.JPEG')).toBe('photo.jpg');
  });
});
