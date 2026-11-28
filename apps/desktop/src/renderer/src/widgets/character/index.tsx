import { Minus, MoveDiagonal2, Plus } from 'lucide-react';
import {
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent,
} from 'react';
import type { DropData } from '@/features/collect-drop';
import astro from '@/shared/assets/astro.webp';
import { CHARACTER_SIZES, TEXT } from '@/shared/config';
import { ipc } from '@/shared/ipc';
import { loadSize, saveSize, sizeAfterDrag, stepSize } from './size';

interface Props {
  /** 캐릭터를 눌렀을 때 (끌어서 옮긴 경우는 제외) */
  onClick?: () => void;
  /** 주면 끌어다 놓기를 받는다 */
  onDropData?: (data: DropData) => void;
  busy?: boolean;
  /** 오른쪽 클릭 (개발용 창을 여는 데 쓴다) */
  onContextMenu?: () => void;
  /** 캐릭터를 잠시 내렸을 때 */
  onHide?: () => void;
}

// 크기 손잡이는 네 모서리 바깥에 둔다. 화살표는 오른쪽 아래에만 보이고, 나머지 셋은 보이지 않지만 똑같이 끌 수 있다.
// sx, sy는 손잡이가 있는 쪽 (왼쪽·위 -1, 오른쪽·아래 1)
const CORNERS = [
  {
    sx: -1,
    sy: -1,
    at: '-top-5 -left-5 cursor-nwse-resize',
  },
  {
    sx: 1,
    sy: -1,
    at: '-top-5 -right-5 cursor-nesw-resize',
  },
  {
    sx: -1,
    sy: 1,
    at: '-bottom-5 -left-5 cursor-nesw-resize',
  },
  {
    sx: 1,
    sy: 1,
    at: '-right-5 -bottom-5 cursor-nwse-resize',
  },
] as const;

// 캐릭터에 마우스를 올렸을 때만 보이는 기호. 원 없이 기호만 두고, 밝은 바탕에서도 보이게 그림자를 준다
const HANDLE =
  'text-ink absolute z-10 flex size-5 items-center justify-center rounded-full opacity-0 drop-shadow-[0_0_2px_rgb(0_0_0/0.9)] transition-opacity group-hover:opacity-100 focus-visible:opacity-100';

const DRAG_THRESHOLD = 4;

/** 바탕화면에 떠 있는 우주 비행사. 끌면 창이 따라 움직이고, 위에 놓으면 수집한다 */
export function Character({
  onClick,
  onDropData,
  busy,
  onContextMenu,
  onHide,
}: Props) {
  const [over, setOver] = useState(false);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const [size, setSize] = useState(loadSize);
  const resize = useRef<{
    x: number;
    y: number;
    from: number;
    sx: 1 | -1;
    sy: 1 | -1;
  } | null>(null);
  const [hidden, setHidden] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const lastBox = useRef<{ w: number; h: number } | null>(null);

  // 창은 캐릭터 칸의 오른쪽 아래를 고정한다. 오른쪽·아래 손잡이를 끌 때는 늘어난 만큼 창을 옮겨, 끄는 모서리의 맞은편이 제자리에 있게 한다
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const prev = lastBox.current;
    const r = resize.current;
    lastBox.current = { w: el.offsetWidth, h: el.offsetHeight };
    if (!prev || !r) return;
    const dx = r.sx > 0 ? el.offsetWidth - prev.w : 0;
    const dy = r.sy > 0 ? el.offsetHeight - prev.h : 0;
    if (dx || dy) ipc.moveWindow(dx, dy);
  }, [size]);

  const changeSize = (next: number) => {
    setSize(next);
    saveSize(next);
  };
  const onResizeMove = (e: PointerEvent) => {
    const r = resize.current;
    if (r)
      changeSize(
        sizeAfterDrag(r.from, e.screenX - r.x, e.screenY - r.y, r.sx, r.sy),
      );
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.screenX, y: e.screenY, moved: false };
  };
  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.screenX - d.x;
    const dy = e.screenY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    d.moved = true;
    d.x = e.screenX;
    d.y = e.screenY;
    ipc.moveWindow(dx, dy);
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    const moved = drag.current.moved;
    drag.current = null;
    if (!moved) onClick?.();
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOver(false);
    onDropData?.({
      files: [...e.dataTransfer.files].map((f) => ({
        name: f.name,
        size: f.size,
        path: ipc.pathForFile(f) || undefined,
        blob: f,
      })),
      uriList: e.dataTransfer.getData('text/uri-list'),
      text: e.dataTransfer.getData('text/plain'),
    });
  };

  if (hidden)
    return (
      <button
        type="button"
        data-character
        aria-label={TEXT.show}
        title={TEXT.show}
        onClick={() => setHidden(false)}
        className="bg-panel text-ink border-line-button shadow-float flex size-5 items-center justify-center rounded-full border"
      >
        <Plus className="size-3" aria-hidden="true" />
      </button>
    );

  // 칸은 우주인이 보이는 부분(그림 480x525 중 214x421)에 맞춘다. 그래야 화면 끝까지 가고 창도 우주인에 맞춰 열린다.
  // 누르고 놓는 영역(버튼)과 그림은 예전 크기 그대로 칸 밖으로 넘친다
  return (
    <div
      ref={root}
      data-character
      className={`group relative aspect-[214/421] ${CHARACTER_SIZES[size]}`}
    >
      {CORNERS.map(({ sx, sy, at }) => (
        <button
          key={at}
          type="button"
          aria-label={TEXT.resize}
          title={TEXT.resize}
          tabIndex={sx > 0 && sy > 0 ? undefined : -1}
          className={`${sx > 0 && sy > 0 ? HANDLE : 'absolute z-10 size-5'} ${at}`}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            resize.current = { x: e.screenX, y: e.screenY, from: size, sx, sy };
          }}
          onPointerMove={onResizeMove}
          onPointerUp={() => (resize.current = null)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft')
              changeSize(stepSize(size, 1));
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight')
              changeSize(stepSize(size, -1));
          }}
        >
          {sx > 0 && sy > 0 && (
            <MoveDiagonal2 className="size-4" aria-hidden="true" />
          )}
        </button>
      ))}
      <button
        type="button"
        aria-label={TEXT.hide}
        title={TEXT.hide}
        onClick={() => {
          setHidden(true);
          onHide?.();
        }}
        className={`${HANDLE} -top-5 left-1/2 -translate-x-1/2`}
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Spacelog 수집 캐릭터"
        className={`absolute top-[-12.35%] left-[-72.7%] h-[124.7%] w-[245.3%] cursor-grab rounded-full transition-transform outline-none active:cursor-grabbing ${
          over ? 'ring-accent scale-105 ring-2' : ''
        } ${busy ? 'animate-pulse' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu?.();
        }}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
        onDragOver={(e) => {
          if (!onDropData) return;
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDropData ? onDrop : undefined}
      >
        <img
          src={astro}
          alt=""
          draggable={false}
          className="size-full object-contain"
        />
      </button>
    </div>
  );
}
