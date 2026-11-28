import type { PanelSide, WindowLayout } from '../../ipc';

interface Point {
  x: number;
  y: number;
}
interface Rect extends Point {
  width: number;
  height: number;
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

/**
 * 창 자리를 정한다. 기준점(캐릭터가 보이는 부분의 오른쪽 아래 모서리)은 화면에 고정하고,
 * 내용 안에서 캐릭터가 어디에 있든 그 자리에 맞춰 창을 놓는다. 창의 투명한 여백은 화면 밖으로 나갈 수 있다.
 */
export function placeWindow(anchor: Point, layout: WindowLayout, area: Rect) {
  // 캐릭터가 보이는 부분은 항상 화면 안에 둔다
  const x = clamp(anchor.x, area.x + layout.baseWidth, area.x + area.width);
  // 위쪽은 여백까지 화면 안에 둔다. macOS가 창을 메뉴 막대 위로 올리지 못하게 막아서, 넘기면 실제 자리와 어긋난다
  const y = clamp(
    anchor.y,
    area.y + layout.pad + layout.baseHeight,
    area.y + area.height,
  );
  // 캐릭터가 화면 왼쪽 절반에 있으면 창을 오른쪽으로, 위쪽 절반에 있으면 아래로 연다
  const side: PanelSide = {
    left: x - layout.baseWidth / 2 < area.x + area.width / 2,
    top: y - layout.baseHeight / 2 < area.y + area.height / 2,
  };
  const bounds: Rect = {
    x: Math.round(x - layout.anchorX),
    y: Math.round(y - layout.anchorY),
    width: Math.max(1, Math.ceil(layout.width)),
    height: Math.max(1, Math.ceil(layout.height)),
  };
  return { anchor: { x, y }, bounds, side };
}
