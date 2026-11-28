import { useState } from 'react';
import {
  getMockScenario,
  MOCK_SCENARIOS,
  setMockScenario,
  type MockScenario,
} from '@/shared/api';
import { Button, Card } from '@/shared/ui';

/** 개발 모드에서만 뜨는 창 (캐릭터를 오른쪽 클릭). 가짜 서버가 다음 저장에 어떻게 답할지 고른다. 실제 사용자에게는 보이지 않는다 */
export function DevPanel({
  onLogout,
  onClose,
}: {
  onLogout: () => void;
  onClose: () => void;
}) {
  const [scenario, setScenario] = useState(getMockScenario);
  return (
    <Card className="flex flex-col gap-3 p-4">
      <p className="text-ink-sub text-fine">
        개발용 설정 · 가짜 서버가 다음 저장에 답하는 방식
      </p>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(MOCK_SCENARIOS) as MockScenario[]).map((value) => (
          <Button
            key={value}
            variant={scenario === value ? 'primary' : 'secondary'}
            aria-pressed={scenario === value}
            onClick={() => {
              setMockScenario(value);
              setScenario(value);
            }}
          >
            {MOCK_SCENARIOS[value]}
          </Button>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={onLogout}>로그아웃</Button>
        <Button onClick={onClose}>닫기</Button>
      </div>
    </Card>
  );
}
