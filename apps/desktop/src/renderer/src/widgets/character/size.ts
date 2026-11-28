import { CHARACTER_SIZES, DEFAULT_CHARACTER_SIZE } from '@/shared/config';

const KEY = 'character-size';
const STEP_PX = 24; // 이만큼 끌 때마다 한 단계

const clamp = (index: number) =>
  Math.min(Math.max(index, 0), CHARACTER_SIZES.length - 1);

/** 왼쪽 위 손잡이를 끈 거리로 새 크기 단계를 정한다. 왼쪽 위로 끌면 커지고 오른쪽 아래로 끌면 작아진다 */
export function sizeAfterDrag(
  startIndex: number,
  dx: number,
  dy: number,
): number {
  return clamp(startIndex + Math.round(-(dx + dy) / 2 / STEP_PX));
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
