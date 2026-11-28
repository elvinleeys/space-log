import { validateFiles, type CollectResult } from '@/entities/record';
import { shrinkLargeImages } from '@/features/shrink-image';
import { ipc } from '@/shared/ipc';

export async function collectFromFilePicker(): Promise<CollectResult> {
  const picked = await ipc.pickFile();
  if (!picked.length) return null;
  const files = await shrinkLargeImages(picked);
  const check = validateFiles(files);
  return check === 'ok' ? { item: { kind: 'file', files } } : { error: check };
}
