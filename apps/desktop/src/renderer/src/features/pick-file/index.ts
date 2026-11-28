import { validateFiles, type CollectResult } from '@/entities/record';
import { ipc } from '@/shared/ipc';

export async function collectFromFilePicker(): Promise<CollectResult> {
  const files = await ipc.pickFile();
  if (!files.length) return null;
  const check = validateFiles(files);
  return check === 'ok' ? { item: { kind: 'file', files } } : { error: check };
}
