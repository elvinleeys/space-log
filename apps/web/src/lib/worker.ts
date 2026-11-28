import 'server-only';

/**
 * 가공 서버(apps/worker)에 가공(글자 추출 + 원문 조각 벡터)을 요청한다. 응답을 기다리지 않는다.
 * AI 분석(AI 정리글)은 포함하지 않는다. 분석은 'AI 분석하기' 버튼의 분석 API에서 따로 요청한다.
 * WORKER_URL이 없거나 요청이 실패해도 기록은 queued로 남고, 가공 서버의 재처리가 가져간다.
 * shortcut: 경로 POST /process, 본문 { record_id }는 잠정 약속. 가공 서버 Pydantic 모델이 정해지면 맞춘다
 */
export function requestProcessing(recordId: string): void {
  const base = process.env.WORKER_URL;
  const secret = process.env.WORKER_SECRET;
  if (!base || !secret) return;

  fetch(new URL('/process', base), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Worker-Secret': secret },
    body: JSON.stringify({ record_id: recordId }),
    signal: AbortSignal.timeout(5000),
  }).catch((e) =>
    console.warn(
      `[worker] 가공 요청 실패, queued로 남김 (record ${recordId}):`,
      e,
    ),
  );
}
