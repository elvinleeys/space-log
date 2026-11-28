// 10MB가 넘는 이미지(jpg·png)를 올리기 전에 클라이언트(웹·데스크톱 렌더러)에서 줄인다.
// 긴 변 4096px 이하로 줄이고 JPEG로 다시 압축, 그래도 크면 품질을 단계적으로 낮춘다.
// 원본은 사용자 컴퓨터에 남고 서버에는 줄인 파일만 올라간다 (docs/decisions.md 2026-11-27)
import { MAX_FILE_SIZE } from '../types/record';

export const COMPRESS_MAX_EDGE = 4096;
/** 품질을 이 순서로 낮춰 가며 10MB 안에 들 때까지 시도한다 */
export const COMPRESS_QUALITY_STEPS = [0.9, 0.8, 0.7, 0.6, 0.5] as const;

const COMPRESSIBLE = ['jpg', 'jpeg', 'png'];

const extOf = (name: string) => {
  const dot = name.lastIndexOf('.');
  return dot <= 0 ? '' : name.slice(dot + 1).toLowerCase();
};

/** 줄여야 하는 파일인지: 10MB를 넘는 jpg·png */
export function needsCompression(name: string, size: number): boolean {
  return size > MAX_FILE_SIZE && COMPRESSIBLE.includes(extOf(name));
}

/** 긴 변을 maxEdge 이하로 맞춘 크기. 이미 작으면 그대로 */
export function fitWithin(
  width: number,
  height: number,
  maxEdge = COMPRESS_MAX_EDGE,
): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) return { width, height };
  const scale = maxEdge / longEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** 줄인 파일 이름: 확장자를 .jpg로 바꾼다 (보고서.png → 보고서.jpg) */
export function compressedFileName(name: string): string {
  const dot = name.lastIndexOf('.');
  return `${dot <= 0 ? name : name.slice(0, dot)}.jpg`;
}

export type CompressResult =
  | { ok: true; file: File; compressed: boolean }
  | { ok: false; reason: 'NOT_COMPRESSIBLE' | 'STILL_TOO_LARGE' };

/**
 * 필요하면 이미지를 줄여 새 File을 돌려준다. 10MB 이하이거나 이미지가 아니면 그대로 돌려준다.
 * 10MB를 넘는 PDF·글 파일은 줄일 수 없어 NOT_COMPRESSIBLE.
 * 브라우저·Electron 렌더러 전용 (createImageBitmap, canvas 사용).
 * shortcut: png를 JPEG로 바꾸면 투명 배경이 흰색이 된다. 투명도가 중요해지면 webp 등 다른 형식 검토
 */
export async function compressImageIfNeeded(
  file: File,
): Promise<CompressResult> {
  if (file.size <= MAX_FILE_SIZE) return { ok: true, file, compressed: false };
  if (!needsCompression(file.name, file.size))
    return { ok: false, reason: 'NOT_COMPRESSIBLE' };

  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { ok: false, reason: 'STILL_TOO_LARGE' };
    ctx.fillStyle = '#fff'; // JPEG는 투명도가 없어 흰 배경을 깐다
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    for (const quality of COMPRESS_QUALITY_STEPS) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', quality),
      );
      if (blob && blob.size <= MAX_FILE_SIZE) {
        return {
          ok: true,
          compressed: true,
          file: new File([blob], compressedFileName(file.name), {
            type: 'image/jpeg',
          }),
        };
      }
    }
    return { ok: false, reason: 'STILL_TOO_LARGE' };
  } finally {
    bitmap.close();
  }
}
