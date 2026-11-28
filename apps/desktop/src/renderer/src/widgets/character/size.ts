import { CHARACTER_SIZES, DEFAULT_CHARACTER_SIZE } from '@/shared/config';

const KEY = 'character-size';
const STEP_PX = 24; // 이만큼 끌 때마다 한 단계

const clamp = (index: number) =>
  Math.min(Math.max(index, 0), CHARACTER_SIZES.length - 1);

/**
 * 모서리 손잡이를 끈 거리로 새 크기 단계를 정한다. 모서리 바깥쪽으로 끌면 커지고 안쪽으로 끌면 작아진다.
 * sx, sy는 손잡이가 있는 쪽: 왼쪽·위는 -1, 오른쪽·아래는 1
 */
export function sizeAfterDrag(
  startIndex: number,
  dx: number,
  dy: number,
  sx: 1 | -1 = -1,
  sy: 1 | -1 = -1,
): number {
  return clamp(startIndex + Math.round((sx * dx + sy * dy) / 2 / STEP_PX));
}

export const stepSize = (index: number, by: number) => clamp(index + by);

export function loadSize(): number {
  const saved = Number(localStorage.getItem(KEY));
  return Number.isInteger(saved) && localStorage.getItem(KEY) !== null
    ? clamp(saved)
    : DEFAULT_CHARACTER_SIZE;
}

export const saveSize = (index: number) =>
  localStorage.setItem(KEY, String(index));
