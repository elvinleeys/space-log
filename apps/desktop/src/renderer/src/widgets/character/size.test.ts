import { describe, expect, it } from 'vitest';
import { CHARACTER_SIZES } from '@/shared/config';
import { sizeAfterDrag, stepSize } from './size';

const last = CHARACTER_SIZES.length - 1;

describe('캐릭터 크기 단계', () => {
  it('왼쪽 위로 끌면 커지고 오른쪽 아래로 끌면 작아진다', () => {
    expect(sizeAfterDrag(2, -24, -24)).toBe(3);
    expect(sizeAfterDrag(2, 24, 24)).toBe(1);
  });

  it('조금 끈 것은 무시한다', () => {
    expect(sizeAfterDrag(2, -5, -5)).toBe(2);
  });

  it('가장 작은 단계와 가장 큰 단계를 넘지 않는다', () => {
    expect(sizeAfterDrag(0, 500, 500)).toBe(0);
    expect(sizeAfterDrag(last, -500, -500)).toBe(last);
    expect(stepSize(last, 1)).toBe(last);
    expect(stepSize(0, -1)).toBe(0);
  });
});
