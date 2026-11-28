import { BrowserWindow, dialog } from 'electron';
import { stat } from 'node:fs/promises';
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

export async function pickFile(parent: BrowserWindow): Promise<PickedFile[]> {
  const result = await dialog.showOpenDialog(parent, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: '지원 파일', extensions: EXTENSIONS },
      { name: '모든 파일', extensions: ['*'] },
    ],
  });
  if (result.canceled) return [];
  return Promise.all(
    result.filePaths.map(async (path) => ({
      name: basename(path),
      size: (await stat(path)).size,
      path,
    })),
  );
}
