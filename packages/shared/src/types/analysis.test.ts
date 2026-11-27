import { describe, expect, it } from 'vitest';
import {
  canMoveAnalysisToMemo,
  canReanalyze,
  canStartAnalysis,
  keyPoints,
  memoWithKeyPoints,
} from './analysis';

const detail = {
  one_line: '한 줄',
  key_points: ['첫째', '둘째', '셋째', '넷째'],
};
const before = {
  record_type: 'file' as const,
  status: 'done' as const,
  original_context: '메모',
  summary: null,
  summary_detail: null,
  analysis_status: 'none' as const,
  analyzed_context: null,
  analysis_moved_at: null,
};
const analyzed = {
  ...before,
  summary: '한 줄',
  summary_detail: detail,
  analysis_status: 'done' as const,
  analyzed_context: '메모',
};

describe('canStartAnalysis (AI 분석하기 버튼)', () => {
  it('분석 내용이 없는 URL·영상·파일·캡처에만 보인다', () => {
    for (const record_type of ['url', 'video', 'file', 'capture'] as const) {
      expect(canStartAnalysis({ ...before, record_type })).toBe(true);
    }
    for (const record_type of ['memo', 'highlight', 'chat'] as const) {
      expect(canStartAnalysis({ ...before, record_type })).toBe(false);
    }
  });

  it('분석 중·분석 완료·삭제 중이면 숨긴다', () => {
    expect(canStartAnalysis({ ...before, analysis_status: 'analyzing' })).toBe(
      false,
    );
    expect(canStartAnalysis(analyzed)).toBe(false);
    expect(canStartAnalysis({ ...before, status: 'deleting' })).toBe(false);
  });

  it('분석이 실패했거나 지운 뒤에는 다시 보인다', () => {
    expect(canStartAnalysis({ ...before, analysis_status: 'failed' })).toBe(
      true,
    );
  });

  it('저장·색인이 끝나기 전에도 누를 수 있다', () => {
    expect(canStartAnalysis({ ...before, status: 'processing' })).toBe(true);
  });
});

describe('canReanalyze (다시 분석 버튼)', () => {
  it('메모가 분석 때와 같으면 비활성', () => {
    expect(canReanalyze(analyzed)).toBe(false);
  });

  it('메모를 고치면 활성, 원래대로 되돌리면 다시 비활성', () => {
    expect(canReanalyze({ ...analyzed, original_context: '메모 수정' })).toBe(
      true,
    );
    expect(canReanalyze({ ...analyzed, original_context: '  메모\r\n' })).toBe(
      false,
    );
  });

  it('분석 내용이 없으면 비활성', () => {
    expect(canReanalyze({ ...before, original_context: '다른 메모' })).toBe(
      false,
    );
  });
});

describe('canMoveAnalysisToMemo (메모에 옮기기)', () => {
  it('분석 내용이 있고 아직 옮기지 않았을 때만', () => {
    expect(canMoveAnalysisToMemo(analyzed)).toBe(true);
    expect(
      canMoveAnalysisToMemo({
        ...analyzed,
        analysis_moved_at: '2026-11-28T00:00:00Z',
      }),
    ).toBe(false);
    expect(canMoveAnalysisToMemo(before)).toBe(false);
  });
});

describe('keyPoints · memoWithKeyPoints', () => {
  it('핵심 내용은 최대 3개, 빈 값 제외', () => {
    expect(keyPoints(analyzed)).toEqual(['첫째', '둘째', '셋째']);
    expect(
      keyPoints({ summary_detail: { key_points: [' a ', '', 3] } }),
    ).toEqual(['a']);
    expect(keyPoints({ summary_detail: null })).toEqual([]);
  });

  it('지금 메모 끝에 빈 줄을 두고 핵심 3개만 덧붙인다 (한 줄 요약은 옮기지 않음)', () => {
    expect(memoWithKeyPoints(analyzed)).toBe('메모\n\n· 첫째\n· 둘째\n· 셋째');
  });

  it('메모가 비어 있으면 핵심 내용만', () => {
    expect(memoWithKeyPoints({ ...analyzed, original_context: '  ' })).toBe(
      '· 첫째\n· 둘째\n· 셋째',
    );
  });
});
