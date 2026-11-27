// 기록 상세 'AI 분석' 영역의 버튼 규칙 (docs/spec/screens/07-record-detail.md)
// 화면과 서버(분석 API)가 같은 규칙으로 판단하도록 여기 둔다.
import { ANALYZABLE_RECORD_TYPES, type InformationRecord } from './record';

type AnalysisFields = Pick<
  InformationRecord,
  | 'record_type'
  | 'status'
  | 'original_context'
  | 'summary'
  | 'summary_detail'
  | 'analysis_status'
  | 'analyzed_context'
  | 'analysis_moved_at'
>;

/** 메모 비교용: 앞뒤 공백·줄바꿈 형식 차이는 같은 메모로 본다 */
const normalizeMemo = (memo: string | null | undefined) =>
  (memo ?? '').replace(/\r\n/g, '\n').trim();

const hasAnalysis = (r: AnalysisFields) =>
  r.analysis_status === 'done' && (!!r.summary || !!r.summary_detail);

/** 'AI 분석하기' 버튼: 분석 대상 형식이고, 분석 내용이 없고, 분석 중이 아니고, 삭제 중이 아닐 때 */
export function canStartAnalysis(r: AnalysisFields): boolean {
  return (
    ANALYZABLE_RECORD_TYPES.includes(r.record_type) &&
    r.status !== 'deleting' &&
    r.analysis_status !== 'analyzing' &&
    !hasAnalysis(r)
  );
}

/** '다시 분석' 버튼 활성: 분석 내용이 있고, 분석 때와 지금 메모가 다를 때만 (무한 호출 방지) */
export function canReanalyze(r: AnalysisFields): boolean {
  return (
    hasAnalysis(r) &&
    r.status !== 'deleting' &&
    normalizeMemo(r.original_context) !== normalizeMemo(r.analyzed_context)
  );
}

/** '메모에 옮기기' 버튼 활성: 분석 내용이 있고 이 분석을 아직 옮기지 않았을 때 */
export function canMoveAnalysisToMemo(r: AnalysisFields): boolean {
  return hasAnalysis(r) && !r.analysis_moved_at && keyPoints(r).length > 0;
}

/** AI 분석의 핵심 내용 (summary_detail.key_points, 최대 3개) */
export function keyPoints(
  r: Pick<InformationRecord, 'summary_detail'>,
): string[] {
  const kp = r.summary_detail?.key_points;
  if (!Array.isArray(kp)) return [];
  return kp
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    .map((v) => v.trim())
    .slice(0, 3);
}

/** '메모에 옮기기' 뒤의 메모: 지금 메모 끝에 빈 줄 하나를 두고 핵심 내용 3개를 '· '로 덧붙인다 */
export function memoWithKeyPoints(
  r: Pick<InformationRecord, 'original_context' | 'summary_detail'>,
): string {
  const points = keyPoints(r)
    .map((p) => `· ${p}`)
    .join('\n');
  const memo = (r.original_context ?? '').replace(/\s+$/, '');
  return memo ? `${memo}\n\n${points}` : points;
}
