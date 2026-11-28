import type { Group } from '@/entities/group';
import type { CollectItem, RecordStatus } from '@/entities/record';

/** 수집앱이 서버에 바라는 것. 실제 연결 때는 packages/shared의 수집 함수와 웹 API로 이 인터페이스를 구현한다 */
export interface CollectorApi {
  listGroups(): Promise<Group[]>;
  createGroup(name: string): Promise<Group>;
  /** 어울리는 그룹의 id. 없으면 null. AI 추천을 켰을 때만 부른다 (shared/config의 AI_RECOMMEND) */
  recommendGroup(item: CollectItem, groups: Group[]): Promise<string | null>;
  saveRecord(item: CollectItem, groupId: string): Promise<{ recordId: string }>;
  getRecordStatus(recordId: string): Promise<RecordStatus>;
}
