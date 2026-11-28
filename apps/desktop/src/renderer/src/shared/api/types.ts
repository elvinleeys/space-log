import type { Group } from '@/entities/group';
import type { CollectItem, RecordStatus } from '@/entities/record';

/** 수집앱이 서버에 바라는 것. 실제 연결 때는 packages/shared의 수집 함수와 웹 API로 이 인터페이스를 구현한다 */
export interface CollectorApi {
  listGroups(): Promise<Group[]>;
  createGroup(name: string): Promise<Group>;
  saveRecord(item: CollectItem, groupId: string): Promise<{ recordId: string }>;
  getRecordStatus(recordId: string): Promise<RecordStatus>;
}
