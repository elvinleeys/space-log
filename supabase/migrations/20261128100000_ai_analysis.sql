-- AI 분석을 '저장 시 자동'에서 'AI 분석하기 버튼·챗봇 요청'으로 바꾼다 (docs/decisions.md 2026-11-28)
-- status는 저장·색인(글자 추출 + 원문 조각 벡터) 상태로만 쓰고, AI 분석 상태는 따로 둔다

alter table public.information_record
  -- none(분석 전) · analyzing(분석 중) · done(분석 완료) · failed(분석 실패)
  add column analysis_status text not null default 'none'
    check (analysis_status in ('none', 'analyzing', 'done', 'failed')),
  -- 화면의 'AI 분석 · 11월 27일 23:27'
  add column analyzed_at timestamptz,
  -- 분석할 때의 메모(original_context). 지금 메모와 다를 때만 '다시 분석'을 허용한다
  add column analyzed_context text,
  -- '메모에 옮기기'를 누른 시각. 같은 분석은 한 번만 옮긴다 (다시 분석하면 비운다)
  add column analysis_moved_at timestamptz;

-- 챗봇 답변을 '기록으로 저장'한 기록. 답변은 AI 분석 칸(summary·summary_detail)에 들어간다
alter table public.information_record drop constraint information_record_record_type_check;
alter table public.information_record add constraint information_record_record_type_check
  check (record_type in ('memo', 'highlight', 'url', 'video', 'file', 'capture', 'chat'));
