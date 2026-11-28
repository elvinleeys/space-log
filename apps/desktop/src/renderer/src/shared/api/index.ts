import { mockApi } from './mock';
import type { CollectorApi } from './types';

// 실제 API를 붙일 때는 이 한 줄만 실제 구현으로 바꾼다
export const api: CollectorApi = mockApi;

export type { CollectorApi } from './types';
export {
  MOCK_SCENARIOS,
  getMockScenario,
  setMockScenario,
  type MockScenario,
} from './mock';
