# F4. 기록 가공·색인
담당: 웹 (apps/worker, FastAPI) · 요구사항: R4

가공은 두 단계로 나뉜다. **자동 가공**(저장하면 바로: 글자 추출 + 원문 조각 벡터)과 **AI 분석**('AI 분석하기' 버튼이나 챗봇 요청 때만: AI 정리글 + 요약본 벡터).

**자동 가공 (status: queued → processing → done)**
- **입력**: queued 상태의 정보 기록, Storage 파일(record_file, 0~10개) 또는 URL·영상 링크·글
- **처리**: 가공 서버(FastAPI)가 형식별로 글자를 뽑는다. PDF, HTML, txt, md, csv는 글자를 그대로 뽑고, 이미지(jpeg, jpg, png, svg)는 OCR로 글자를 읽는다. 유튜브 같은 영상 링크는 자막이나 음성을 글로 바꾼다. 원문 조각 벡터를 파일마다 만들어 Qdrant에 올린다. 처리 상태는 Supabase DB에 저장한다. '분류 안 된 기록'이면 뽑은 글자·파일 이름·메모로 기존 그룹 중 하나를 추천한다. 기록 상세 'AI 추천' 버튼은 이 글자와 메모로 추천한다 (F3). **AI 정리글은 만들지 않는다**

**AI 분석 (analysis_status: none·failed → analyzing → done)**
- **입력**: URL·영상·파일·캡처 기록 (메모·하이라이트는 대상 아님. 하이라이트는 요약하지 않고 선택 문장 그대로 둔다), 메모(original_context)
- **시작**: 기록 상세의 'AI 분석하기'·'다시 분석' 버튼, 챗봇의 기록 하나 분석 요청. '다시 분석'은 마지막 분석 뒤 메모에 새로 쓴 글자가 10자 이상일 때만 허용한다 (analyzed_context와 '메모에 옮기기'로 덧붙인 글은 세지 않음, 공백 제외). 'AI 활용 꺼짐' 그룹(ai_search_excluded)의 기록은 분석하지 않는다
- **처리**: 글자를 다시 읽는다(Storage 원본, 원본이 지워진 출처 링크 파일·URL·영상은 원문을 다시 가져옴). 파일 내용(여러 개면 모두)과 메모(있으면)를 함께 검토해 기록 하나에 AI 정리글 1개를 만든다: 핵심 1줄 + 요약 3개. 직군별 관점 없이 일반적인 관점으로 쓴다 (양식: docs/database.md). 요약본 벡터(핵심 1줄 + 요약 3개)를 Qdrant에 올리고, summary·summary_detail·analyzed_at·analyzed_context를 저장하며 analysis_moved_at을 비운다
- **지우기**: summary·summary_detail과 요약본 벡터를 지우고 analysis_status를 none으로 되돌린다. 원문 조각 벡터는 남긴다
- **API**: `POST /api/records/{id}/analysis`(분석·다시 분석, 새로 쓴 글자가 10자 미만이면 409 ANALYSIS_UNCHANGED, 대상 아닌 형식이면 400), `DELETE /api/records/{id}/analysis`(지우기). 웹 서버가 가공 서버에 분석을 요청하고 바로 응답(analyzing), 화면은 상태를 조회한다 [확인 필요: 분석 결과를 기다리는 방식. 조회 반복, 실시간 알림]
- **원문 처리**: 출처 링크(source_url)가 있는 파일은 가공 성공(done) 후 Storage 원본을 지우고 출처 링크로 본다. 출처 링크가 없는 파일(내 컴퓨터에서 올린 파일, 화면 캡처)은 원본을 유지한다. 가공에 실패한 파일은 지우지 않는다. URL·영상 링크의 원문 글은 저장하지 않는다. 원문 조각 벡터는 관련 기록을 찾는 데만 쓴다. 원문 조각 글 저장은 고도화 항목(C안)
- **출력**: 자동 가공 — 원문 조각 벡터, status done / AI 분석 — AI 정리글, 요약본 벡터, analysis_status done
- **예외**: 실패하면 failed 상태와 오류 내용을 남긴다. [확인 필요: 재시도 방식] [확인 필요: 원문을 가져올 수 없는 링크 처리. 인스타그램, 유료 기사] [확인 필요: 자막이 없는 영상의 음성 변환 방법, 영상 길이 제한]

데이터: docs/database.md (Qdrant)
