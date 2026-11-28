import type { CollectItem, RecordStatus } from '@/entities/record';
import type { CollectorApi } from '@/shared/api';
import { POLL_INTERVAL_MS, POLL_TIMEOUT_MS } from '@/shared/config';

export type SaveNotice =
  'uploading' | 'queued' | 'done' | 'saveFailed' | 'processFailed';

interface PollOptions {
  intervalMs: number;
  timeoutMs: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 처리 상태를 간격마다 묻는다. done, failed, deleting(웹에서 지우는 중)이면 멈추고, 제한 시간이 지나면 'timeout' */
export async function pollStatus(
  getStatus: () => Promise<RecordStatus>,
  { intervalMs, timeoutMs }: PollOptions,
): Promise<'done' | 'failed' | 'deleting' | 'timeout'> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() + intervalMs <= deadline) {
    await sleep(intervalMs);
    try {
      const status = await getStatus();
      if (status === 'done' || status === 'failed' || status === 'deleting')
        return status;
    } catch {
      // 조회 한 번이 실패해도 다음 차례에 다시 묻는다
    }
  }
  return 'timeout';
}

/** 저장하고, 가공이 끝날 때까지 상황을 알린다. 제한 시간이 지나면 알리지 않고 멈춘다 */
export async function saveAndTrack(
  api: Pick<CollectorApi, 'saveRecord' | 'getRecordStatus'>,
  item: CollectItem,
  groupId: string,
  notify: (notice: SaveNotice) => void,
  options: PollOptions = {
    intervalMs: POLL_INTERVAL_MS,
    timeoutMs: POLL_TIMEOUT_MS,
  },
): Promise<void> {
  notify('uploading');
  let recordId: string;
  try {
    ({ recordId } = await api.saveRecord(item, groupId));
  } catch {
    notify('saveFailed');
    return;
  }
  notify('queued');
  const result = await pollStatus(() => api.getRecordStatus(recordId), options);
  if (result === 'done') notify('done');
  if (result === 'failed') notify('processFailed');
}
