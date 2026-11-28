import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RecordStatus } from '@/entities/record';
import { pollStatus, saveAndTrack, type SaveNotice } from '.';

const options = { intervalMs: 3000, timeoutMs: 120000 };
const item = { kind: 'memo', text: '메모' } as const;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('pollStatus', () => {
  it('done이 되면 멈춘다', async () => {
    const statuses: RecordStatus[] = ['processing', 'processing', 'done'];
    const getStatus = vi.fn(async () => statuses.shift()!);
    const result = pollStatus(getStatus, options);
    await vi.advanceTimersByTimeAsync(9000);
    expect(await result).toBe('done');
    expect(getStatus).toHaveBeenCalledTimes(3);
  });

  it('웹에서 지우는 중(deleting)이면 멈춘다', async () => {
    const getStatus = vi.fn(async () => 'deleting' as RecordStatus);
    const result = pollStatus(getStatus, options);
    await vi.advanceTimersByTimeAsync(130000);
    expect(await result).toBe('deleting');
    expect(getStatus).toHaveBeenCalledTimes(1);
  });

  it('2분이 지나면 timeout으로 멈춘다', async () => {
    const getStatus = vi.fn(async () => 'processing' as RecordStatus);
    const result = pollStatus(getStatus, options);
    await vi.advanceTimersByTimeAsync(130000);
    expect(await result).toBe('timeout');
    expect(getStatus).toHaveBeenCalledTimes(40);
  });

  it('조회가 한 번 실패해도 계속 묻는다', async () => {
    const getStatus = vi
      .fn<() => Promise<RecordStatus>>()
      .mockRejectedValueOnce(new Error('네트워크'))
      .mockResolvedValue('failed');
    const result = pollStatus(getStatus, options);
    await vi.advanceTimersByTimeAsync(6000);
    expect(await result).toBe('failed');
  });
});

describe('saveAndTrack', () => {
  const run = async (api: Parameters<typeof saveAndTrack>[0]) => {
    const notices: SaveNotice[] = [];
    const done = saveAndTrack(api, item, 'g1', (n) => notices.push(n), options);
    await vi.advanceTimersByTimeAsync(130000);
    await done;
    return notices;
  };

  it('성공: 올리는 중 → 업로드 완료 → 가공 완료', async () => {
    const notices = await run({
      saveRecord: async () => ({ recordId: 'r1' }),
      getRecordStatus: async () => 'done',
    });
    expect(notices).toEqual(['uploading', 'queued', 'done']);
  });

  it('저장 실패: 상태를 묻지 않는다', async () => {
    const getRecordStatus = vi.fn(async () => 'done' as RecordStatus);
    const notices = await run({
      saveRecord: async () => {
        throw new Error('서버 오류');
      },
      getRecordStatus,
    });
    expect(notices).toEqual(['uploading', 'saveFailed']);
    expect(getRecordStatus).not.toHaveBeenCalled();
  });

  it('가공 실패를 알린다', async () => {
    const notices = await run({
      saveRecord: async () => ({ recordId: 'r1' }),
      getRecordStatus: async () => 'failed',
    });
    expect(notices).toEqual(['uploading', 'queued', 'processFailed']);
  });

  it('지우는 중인 기록은 더 알리지 않는다', async () => {
    const notices = await run({
      saveRecord: async () => ({ recordId: 'r1' }),
      getRecordStatus: async () => 'deleting',
    });
    expect(notices).toEqual(['uploading', 'queued']);
  });

  it('2분이 지나도 끝나지 않으면 더 알리지 않는다', async () => {
    const notices = await run({
      saveRecord: async () => ({ recordId: 'r1' }),
      getRecordStatus: async () => 'processing',
    });
    expect(notices).toEqual(['uploading', 'queued']);
  });
});
