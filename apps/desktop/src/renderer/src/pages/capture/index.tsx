import { useEffect, useRef } from 'react';
import { ipc, type CaptureRect } from '@/shared/ipc';

/** 화면 전체를 덮는 창. 찍어 둔 화면을 어둡게 보여 주고, 끌어서 고른 부분만 밝게 한다. Esc로 취소 */
export function CapturePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const ratio = window.devicePixelRatio;
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    ctx.scale(ratio, ratio);

    const shot = new Image();
    let start: { x: number; y: number } | null = null;
    let rect: CaptureRect | null = null;

    const draw = () => {
      const { innerWidth: w, innerHeight: h } = window;
      ctx.drawImage(shot, 0, 0, w, h);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, w, h);
      if (!rect) return;
      const sx = shot.width / w;
      const sy = shot.height / h;
      ctx.drawImage(
        shot,
        rect.x * sx,
        rect.y * sy,
        rect.width * sx,
        rect.height * sy,
        rect.x,
        rect.y,
        rect.width,
        rect.height,
      );
      ctx.strokeStyle = '#0066cc';
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    };

    shot.onload = draw;
    ipc.captureImage().then((dataUrl) => {
      if (dataUrl) shot.src = dataUrl;
      else ipc.captureSelect(null);
    });

    const onDown = (e: MouseEvent) => {
      start = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: MouseEvent) => {
      if (!start) return;
      rect = {
        x: Math.min(start.x, e.clientX),
        y: Math.min(start.y, e.clientY),
        width: Math.abs(e.clientX - start.x),
        height: Math.abs(e.clientY - start.y),
      };
      draw();
    };
    const onUp = () => start && ipc.captureSelect(rect);
    const onKey = (e: KeyboardEvent) =>
      e.key === 'Escape' && ipc.captureSelect(null);

    window.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 block h-screen w-screen cursor-crosshair"
    />
  );
}
