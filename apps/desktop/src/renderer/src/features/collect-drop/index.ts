import {
  classifyUrl,
  validateFiles,
  type CollectResult,
  type FileEntry,
} from '@/entities/record';

/** 캐릭터 위에 놓인 것 */
export interface DropData {
  files: FileEntry[];
  uriList?: string;
  text?: string;
}

/** 끌어다 놓기는 파일, 이미지, 브라우저 주소만 받는다. 글은 클립보드 붙여넣기로 넣는다 */
export function classifyDrop(data: DropData): CollectResult {
  if (data.files.length) {
    const check = validateFiles(data.files);
    return check === 'ok'
      ? { item: { kind: 'file', files: data.files } }
      : { error: check };
  }
  const uri = data.uriList
    ?.split(/\r?\n/)
    .find((line) => line && !line.startsWith('#'));
  const item = classifyUrl(uri ?? '') ?? classifyUrl(data.text ?? '');
  if (item) return { item };
  return data.text?.trim() ? { error: 'textDrop' } : null;
}
