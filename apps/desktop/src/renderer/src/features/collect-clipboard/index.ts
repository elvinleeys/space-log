import {
  classifyUrl,
  validateFile,
  type CollectResult,
} from '@/entities/record';
import { ipc } from '@/shared/ipc';

/** 복사해 둔 것을 읽는다: 이미지는 파일 기록, 주소는 URL 기록, 글은 하이라이트 */
export async function collectFromClipboard(): Promise<CollectResult> {
  const { text, image, sourceUrl } = await ipc.readClipboard();
  if (image) {
    const name = '클립보드 이미지.png';
    const check = validateFile(name, image.size);
    return check === 'ok'
      ? { item: { kind: 'file', files: [{ name, ...image }] } }
      : { error: check };
  }
  if (!text) return { error: 'emptyClipboard' };
  return { item: classifyUrl(text) ?? { kind: 'highlight', text, sourceUrl } };
}
