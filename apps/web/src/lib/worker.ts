import 'server-only';

/**
 * 가공 서버(apps/worker)에 가공(글자 추출 + 원문 조각 벡터)을 요청한다. 응답을 기다리지 않는다.
 * AI 분석(AI 정리글)은 포함하지 않는다. 분석은 'AI 분석하기' 버튼의 분석 API에서 따로 요청한다.
 * WORKER_URL이 없거나 요청이 실패해도 기록은 queued로 남고, 가공 서버의 재처리가 가져간다.
 * shortcut: 경로 POST /process, 본문 { record_id }는 잠정 약속. 가공 서버 Pydantic 모델이 정해지면 맞춘다
 */
export function requestProcessing(recordId: string): void {
  post('/process', recordId, '가공 요청 실패, queued로 남김');
}

/**
 * 가공 서버에 AI 분석(핵심 1줄 + 요약 3개)을 요청한다. 응답을 기다리지 않는다.
 * 부르기 전에 analysis_status를 analyzing으로 바꿔 둔다. 가공 서버가 끝나면 done 또는 failed로 바꾼다.
 * 분석해도 되는지(다시 분석 조건, AI 활용 꺼짐 그룹)는 부르는 쪽이 먼저 판단한다.
 */
export function requestAnalysis(recordId: string): void {
  post('/analyze', recordId, '분석 요청 실패');
}

function post(path: string, recordId: string, failure: string): void {
  const base = process.env.WORKER_URL;
  const secret = process.env.WORKER_SECRET;
  if (!base || !secret) return;

  fetch(new URL(path, base), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Worker-Secret': secret },
    body: JSON.stringify({ record_id: recordId }),
    signal: AbortSignal.timeout(5000),
  }).catch((e) => console.warn(`[worker] ${failure} (record ${recordId}):`, e));
}
