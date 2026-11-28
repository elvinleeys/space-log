import { validateFile, type CollectResult } from '@/entities/record';
import { shrinkIfLarge } from '@/features/shrink-image';
import { ipc } from '@/shared/ipc';

/** 화면에서 영역을 골라 캡처한다 */
export async function collectFromCapture(): Promise<CollectResult> {
  const result = await ipc.startCapture();
  if (!result.ok)
    return result.reason === 'unavailable'
      ? { error: 'captureUnavailable' }
      : null;
  const file = await shrinkIfLarge({
    name: `화면 캡처 ${new Date().toLocaleString('ko-KR')}.png`,
    size: result.size,
    dataUrl: result.dataUrl,
  });
  const check = validateFile(file.name, file.size);
  if (check !== 'ok') return { error: check };
  return { item: { kind: 'capture', ...file } };
}
