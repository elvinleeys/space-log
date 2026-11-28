import { compressImageIfNeeded, needsCompression } from '@space-log/shared';
import type { FileEntry } from '@/entities/record';
import { ipc } from '@/shared/ipc';

/** 파일 내용을 읽는다: 끌어다 놓은 파일, 클립보드·캡처 그림, 파일선택으로 고른 파일 순 */
async function readEntry(entry: FileEntry): Promise<Blob | null> {
  if (entry.blob) return entry.blob;
  if (entry.dataUrl) return (await fetch(entry.dataUrl)).blob();
  if (entry.path)
    return new Blob([(await ipc.readPickedFile(entry.path)) as BlobPart]);
  return null;
}

/**
 * 10MB가 넘는 jpg·png를 올리기 전에 줄인다 (packages/shared의 줄이기 함수 사용).
 * 줄이지 못한 파일은 그대로 돌려주어 뒤의 크기 검사에서 '10MB 초과'로 걸리게 한다.
 */
export async function shrinkIfLarge<T extends FileEntry>(entry: T): Promise<T> {
  if (!needsCompression(entry.name, entry.size)) return entry;
  try {
    const source = await readEntry(entry);
    if (!source) return entry;
    const result = await compressImageIfNeeded(new File([source], entry.name));
    if (!result.ok) return entry;
    // 줄인 그림은 내용을 직접 들고 간다. 원본 경로와 원본 dataUrl은 더 쓰지 않는다
    return {
      ...entry,
      name: result.file.name,
      size: result.file.size,
      blob: result.file,
      path: undefined,
      dataUrl: undefined,
    };
  } catch {
    return entry;
  }
}

export const shrinkLargeImages = (files: FileEntry[]): Promise<FileEntry[]> =>
  Promise.all(files.map(shrinkIfLarge));
