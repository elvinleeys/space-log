# 역할
Next.js 웹. 수집 + 찾기 + 관리를 맡는다.
- 화면: 로그인, 메인 우주, 행성 상세 패널, 기록 넣기, 기록 목록, 기록 상세, 물어보기, 설정 (P1: 연결, 블랙홀)
- 서버 API: 기록 생성, 업로드 권한 발급, 가공 요청 전달, 조회·검색, 챗봇, 데스크톱 로그인 지원

# 명세
- 화면: docs/spec/screens/ (02~11)
- 기능: docs/spec/features/ (f01~f12)
- 작업 목록: docs/tasks/dev-b-web.md

# 화면 규칙
- 웹 UI 기준은 시안 v3(docs/design/spacelog-prototype-v3.html)와 docs/design/design.md. 배치·동작은 docs/spec/screens와 화면정의서, 색·글자·모서리 등 값은 apps/web/src/app/globals.css의 디자인 토큰을 쓴다
- 화면 글자는 '기록'·'그룹'을 쓰고 '별'·'행성'이라고 쓰지 않는다. Space에서 그룹은 행성 모양, '분류 안 된 기록'은 성운 모양
- 기간 필터(전체·오늘·이번 주·이번 달·직접 지정)의 기준은 기록의 만든 시각(넣은 날)
- 처리 중(uploading, queued, processing)인 기록도 화면에 보여 준다
- 휴대폰 웹에서도 열람과 저장이 되어야 한다 (반응형)

# API 규칙
- 사용자 확인은 Supabase 인증 세션 기준. 다른 사용자의 기록·그룹에 접근하지 못하게 할 것
- 기록 생성 시 status uploading, 업로드 완료 알림 시 queued로 바꾼 뒤 worker에 가공 요청. 파일 없는 기록(memo·highlight·url·video)은 생성할 때 바로 queued로 만들고 가공 요청
- 파일 기록은 파일(1~10개, 합계 50MB)마다 record_file 행과 서명 업로드 주소(createSignedUploadUrl)를 발급. 경로는 `user_id/record_id/file_id.확장자`, 비밀키 클라이언트는 이때만 쓴다. 발급이 하나라도 실패하면 기록을 지워 되돌린다
- 업로드 완료 알림은 모든 파일이 Storage에 있을 때만 queued로 바꾼다
- 요청 검사·응답 형식은 packages/shared의 validateCreateRecordRequest와 타입을 따른다. 오류 응답: `{ error: { code, message } }` (INVALID_INPUT 400, TOO_MANY_FILES 400, UNAUTHORIZED 401, GROUP_NOT_FOUND 404, FILE_TOO_LARGE 413, RECORD_TOO_LARGE 413, UNSUPPORTED_FILE_TYPE 415)
- 화면의 기록 제목·파일 이름은 packages/shared의 displayRecordTitle·displayFileName으로 만든다 (DB에 저장하지 않음)
- 로그인 확인: 데스크톱은 `Authorization: Bearer 토큰`, 웹은 쿠키 세션 (getAuthedClient)
- 저장 때 worker에 보내는 요청은 자동 가공(글자 추출 + 원문 조각 벡터)만. AI 분석은 보내지 않는다
- information_content는 memo·highlight 본문 전용. 다른 형식의 메모는 original_context (기록 상세의 '메모')
- AI 분석 API (명세만, 구현은 다음 작업): `POST /api/records/{id}/analysis`(분석·다시 분석. 대상 url·video·file·capture, 메모에 새로 쓴 글자가 10자 미만이면 409 ANALYSIS_UNCHANGED, 분석 중이면 409, 'AI 활용 꺼짐' 그룹의 기록이면 거절 [확인 필요: 오류 코드]), `DELETE /api/records/{id}/analysis`(지우기: AI 정리글 + 요약본 벡터, analysis_status none)
- 메모 자동 저장 `PATCH /api/records/{id}` (original_context, '메모에 옮기기' 시 analysis_moved_at). 버튼 판단은 packages/shared canStartAnalysis·canReanalyze·canMoveAnalysisToMemo
- 챗봇 '기록으로 저장'은 chat 기록(analysis_status done, 답변은 summary·summary_detail, 근거 기록은 summary_detail.sources). POST /api/records로는 chat을 만들 수 없다
- worker 요청에는 X-Worker-Secret 헤더를 붙이고, 응답을 기다리지 않고 바로 클라이언트에 응답
- worker 전달이 실패해도 queued로 남겨 두면 worker의 재처리가 처리한다

# 데스크톱 로그인 지원
- 데스크톱에서 열린 로그인이면, 성공 후 http://127.0.0.1:포트/callback?code=일회용코드 로 이동
- 일회용 코드는 127.0.0.1 주소로만 보낼 것

# 챗봇 (Next.js 서버에서 처리)
- 질문 벡터는 worker와 같은 임베딩 모델로 만든다. 모델 이름은 한 곳의 설정값을 같이 쓸 것
- Qdrant 연결 코드는 서버 코드에만 두고, packages/shared/src/vector의 인터페이스를 구현한다
- Qdrant 검색에는 user_id 필터를 반드시 건다
- status가 deleting인 기록은 화면, 챗봇, MCP 찾기, 연관 기록 어디에도 보여 주지 않는다
- 웹 챗봇과 MCP 찾기 결과에서 ai_search_excluded가 참인 그룹의 기록을 반드시 뺀다 (기록 목록·우주 화면은 그대로 보여 줌). 검색할 때 제외 그룹 id 목록을 Qdrant 조건으로 넘겨 group_id로 거른다
- 같은 그룹(화면: AI 활용 꺼짐)의 기록은 AI 분석('AI 분석하기'·다시 분석·챗봇 기록 하나 분석)과 기록 상세 'AI 추천'도 거절한다. 자동 가공과 가공 후 그룹 추천은 그대로
- 기록의 그룹을 바꾸거나 그룹 삭제 시 기록을 옮기면, 그 record_id의 Qdrant 벡터 group_id도 같은 요청 안에서 갱신한다
- 답변 재료는 요약본, 하이라이트 문장, 메모 글. URL·영상 링크의 원문 글은 저장하지 않으므로 쓰지 않는다
- 내 기록에 없으면 찾지 못했다고 답하고 외부 지식으로 답하지 않는다. 근거 기록(그룹, 제목)을 함께 돌려준다

# 기록 삭제
- docs/database.md의 '기록 삭제 절차'를 따른다: 확인 창 → status deleting → Qdrant 벡터 삭제 → Storage 파일 삭제 → DB 기록 삭제
- 기록 상세의 지우기, 그룹을 '기록까지 모두 삭제', 블랙홀의 지우기가 모두 같은 절차를 쓴다

# 연관 기록 (기록 상세)
- 이 기록의 요약본 벡터로 Qdrant를 검색해 유사도 0.8 이상 중 상위 3개를 링크로 보여 준다. 자기 자신 제외, user_id 필터
- 결과는 DB에서 다시 확인해 없거나 deleting인 기록을 뺀다
- 연결하기·삭제 버튼 없이 보기 전용. 연결(모아보기·별자리)과 별개
- AI 분석이 없어 요약본 벡터가 없는 기록은 연관 기록(화면: 함께 볼 만한 기록)을 보여 주지 않는다

# 그룹 삭제
- 빈 그룹은 같은 자리에서 '삭제'를 한 번 더 눌러 지운다
- 기록이 있으면 '기록을 다른 그룹으로 옮기고 삭제'와 '기록까지 모두 삭제' 중 하나를 묻고 진행. 기록까지 삭제하면 기록마다 기록 삭제 절차를 따른다

# 미정 — 구현 전에 사용자에게 선택지를 주고 물어볼 것
- 3D 우주 구현 라이브러리
- 검색 결과 표시 위치, 검색 범위, 의미 검색 사용 여부
- AI 그룹 추천 처리 위치: 기록 상세 'AI 추천' 버튼, 가공 후 '분류 안 된 기록' 추천. 저장 창(웹 기록 넣기, 데스크톱)에는 AI 추천이 없다
- 그룹 삭제 시 옮길 그룹 고르는 방식, '분류 안 된 기록' 보호
- 실패한 기록 삭제를 다시 시도하는 주체 (가공 서버의 주기 작업, 웹 서버)
- Storage 파일을 보여 주는 방식 (공개 주소, 기한이 있는 서명 주소)
- 챗봇의 사용법 질문 처리, 대화 기록 저장
- 그 밖은 docs/open-questions.md
