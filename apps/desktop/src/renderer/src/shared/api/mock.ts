// 가짜 응답. 서버 없이 화면과 알림을 확인하려고 둔다.
import type { Group } from '@/entities/group';
import { validateCreateRecordRequest } from '@space-log/shared';
import { itemLabel, toCreateRecordRequest } from '@/entities/record';
import type { CollectorApi } from './types';

export type MockScenario = 'success' | 'saveFail' | 'processFail';
export const MOCK_SCENARIOS: Record<MockScenario, string> = {
  success: '성공',
  saveFail: '저장 실패',
  processFail: '가공 실패',
};

let scenario: MockScenario = 'success';
export const getMockScenario = () => scenario;
export const setMockScenario = (next: MockScenario) => (scenario = next);

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 서버의 그룹 id처럼 UUID 모양으로 만든다 (기록 생성 검사가 UUID만 받는다)
const gid = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;

// 이름과 색은 시안 A의 그룹 색 표를 따른다
const groups: Group[] = [
  {
    id: gid(0),
    name: '분류 안 된 기록',
    color: '#cfd6e6',
    isDefault: true,
  },
  { id: gid(1), name: '제품 기획', color: '#8fb4ff' },
  { id: gid(2), name: '읽은 것들', color: '#ffb07a' },
  { id: gid(3), name: '생각 조각', color: '#c4a8ff' },
  { id: gid(4), name: '디자인 레퍼런스', color: '#ff8fcf' },
  { id: gid(5), name: '회의록', color: '#6fdcaa' },
  { id: gid(6), name: 'CSV 데이터', color: '#7fe3ff' },
];

// 추천 흉내: 그룹마다 낱말 몇 개로 고른다
const KEYWORDS: Record<string, string[]> = {
  [gid(6)]: ['.csv', '데이터'],
  [gid(5)]: ['회의'],
  [gid(4)]: ['디자인', 'figma', 'ui', '.png', '.jpg', '.jpeg', '.svg', '캡처'],
  [gid(1)]: ['기획', 'prd', '로드맵', '.pdf'],
  [gid(2)]: ['http', '.html', '.md', '.txt'],
  [gid(3)]: ['생각', '메모', '아이디어'],
};

const polls = new Map<string, number>();

export const mockApi: CollectorApi = {
  async listGroups() {
    await wait(150);
    return [...groups];
  },
  async createGroup(name) {
    await wait(200);
    const group = { id: crypto.randomUUID(), name };
    groups.push(group);
    return group;
  },
  async recommendGroup(item) {
    await wait(700);
    const text = itemLabel(item).toLowerCase();
    return (
      Object.keys(KEYWORDS).find((id) =>
        KEYWORDS[id].some((word) => text.includes(word)),
      ) ?? null
    );
  },
  async saveRecord(item, groupId) {
    await wait(900);
    if (scenario === 'saveFail') throw new Error('가짜 저장 실패');
    // 실제 서버가 거를 요청은 가짜 응답에서도 실패하게 한다
    const check = validateCreateRecordRequest(
      toCreateRecordRequest(item, groupId),
    );
    if (!check.ok) throw new Error(check.message);
    return { recordId: `record-${Date.now()}` };
  },
  async getRecordStatus(recordId) {
    const count = (polls.get(recordId) ?? 0) + 1;
    polls.set(recordId, count);
    if (count < 2) return 'processing';
    return scenario === 'processFail' ? 'failed' : 'done';
  },
};
