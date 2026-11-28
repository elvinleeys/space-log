import { MoveDiagonal2 } from 'lucide-react';
import { useRef, useState, type DragEvent, type PointerEvent } from 'react';
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
}

const DRAG_THRESHOLD = 4;

/** 바탕화면에 떠 있는 우주 비행사. 끌면 창이 따라 움직이고, 위에 놓으면 수집한다 */
export function Character({ onClick, onDropData, busy, onContextMenu }: Props) {
  const [over, setOver] = useState(false);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const [size, setSize] = useState(loadSize);
  const resize = useRef<{ x: number; y: number; from: number } | null>(null);

  const changeSize = (next: number) => {
    setSize(next);
    saveSize(next);
  };
  const onResizeMove = (e: PointerEvent) => {
    const r = resize.current;
    if (r) changeSize(sizeAfterDrag(r.from, e.screenX - r.x, e.screenY - r.y));
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
      })),
      uriList: e.dataTransfer.getData('text/uri-list'),
      text: e.dataTransfer.getData('text/plain'),
    });
  };

  return (
    <div className={`group relative ${CHARACTER_SIZES[size]}`}>
      {/* 크기 손잡이: 창의 오른쪽 아래가 고정이라 왼쪽 위에 둔다 */}
      <button
        type="button"
        aria-label={TEXT.resize}
        title={TEXT.resize}
        className="bg-panel text-ink border-line-button absolute top-0 left-0 z-10 flex size-6 cursor-nwse-resize items-center justify-center rounded-full border opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          resize.current = { x: e.screenX, y: e.screenY, from: size };
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
        <MoveDiagonal2 className="size-3.5 opacity-80" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Spacelog 수집 캐릭터"
        className={`size-full cursor-grab rounded-full transition-transform outline-none active:cursor-grabbing ${
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
