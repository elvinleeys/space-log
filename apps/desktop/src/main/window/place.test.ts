import { describe, expect, it } from 'vitest';
import { placeWindow } from './place';

const area = { x: 0, y: 0, width: 1000, height: 800 };
const base = { baseWidth: 100, baseHeight: 100, pad: 20 };

describe('placeWindow', () => {
  it('오른쪽 아래에 있으면 창이 왼쪽 위로 열리고 캐릭터 칸은 그대로다', () => {
    const closed = { width: 100, height: 100, anchorX: 100, anchorY: 100 };
    const open = { width: 300, height: 400, anchorX: 300, anchorY: 400 };
    const a = placeWindow({ x: 900, y: 700 }, { ...closed, ...base }, area);
    const b = placeWindow({ x: 900, y: 700 }, { ...open, ...base }, area);
    expect(a.side).toEqual({ left: false, top: false });
    expect(a.bounds).toMatchObject({ x: 800, y: 600 });
    expect(b.bounds).toEqual({ x: 600, y: 300, width: 300, height: 400 });
    expect(b.anchor).toEqual(a.anchor);
  });

  it('왼쪽 위에 있으면 방향을 뒤집으라고 알리고, 뒤집힌 배치에서도 캐릭터 칸은 그대로다', () => {
    // 뒤집힌 배치: 캐릭터 칸이 내용의 왼쪽 위에 있다
    const open = { width: 300, height: 400, anchorX: 100, anchorY: 100 };
    const r = placeWindow({ x: 150, y: 150 }, { ...open, ...base }, area);
    expect(r.side).toEqual({ left: true, top: true });
    expect(r.bounds).toMatchObject({ x: 50, y: 50 });
  });

  it('캐릭터 칸이 화면 밖으로 나가지 않는다', () => {
    const closed = { width: 100, height: 100, anchorX: 100, anchorY: 100 };
    const r = placeWindow({ x: -50, y: 2000 }, { ...closed, ...base }, area);
    expect(r.anchor).toEqual({ x: 100, y: 800 });
  });

  it('위쪽 끝에서는 창의 여백까지 화면 안에 둔다', () => {
    const closed = { width: 140, height: 140, anchorX: 120, anchorY: 120 };
    const r = placeWindow({ x: 500, y: -50 }, { ...closed, ...base }, area);
    expect(r.anchor.y).toBe(120);
    expect(r.bounds.y).toBe(0);
  });
});
