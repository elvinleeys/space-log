import { dialog } from 'electron';
import { readFile, stat } from 'node:fs/promises';
import { basename } from 'node:path';
import type { PickedFile } from '../../ipc';

// 형식 검사는 renderer의 entities/record가 맡는다. 여기 목록은 파일 선택 창에서 고르기 쉽게 하는 용도다.
const EXTENSIONS = [
  'csv',
  'txt',
  'md',
  'jpeg',
  'jpg',
  'png',
  'svg',
  'html',
  'pdf',
];

// 사용자가 파일선택 창에서 직접 고른 경로. 화면(renderer)은 이 경로의 내용만 읽을 수 있다
const picked = new Set<string>();

/** 큰 이미지를 줄이려고 화면이 파일 내용을 달라고 할 때 쓴다 */
export async function readPickedFile(path: string): Promise<Uint8Array> {
  if (!picked.has(path)) throw new Error('고르지 않은 파일은 읽을 수 없어요');
  return readFile(path);
}

export async function pickFile(): Promise<PickedFile[]> {
  // 부모 창을 주지 않는다. 주면 작은 캐릭터 창에 붙어서 뜨고, 안 주면 화면 가운데에 뜬다
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: '지원 파일', extensions: EXTENSIONS },
      { name: '모든 파일', extensions: ['*'] },
    ],
  });
  if (result.canceled) return [];
  for (const path of result.filePaths) picked.add(path);
  return Promise.all(
    result.filePaths.map(async (path) => ({
      name: basename(path),
      size: (await stat(path)).size,
      path,
    })),
  );
}
