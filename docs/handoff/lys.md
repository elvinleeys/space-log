## 2026-11-27

### 오늘 한 일
- 가공 서버 FastAPI 전환 문서와 develop 브랜치 전략 Git 규칙(docs/git.md) 머지 (#15)
- Prettier·ESLint 설정, Claude 코드 수정 시 자동 포맷 hook, 세션 시작 상태 hook 추가 및 main 단일 브랜치 전략으로 변경 머지 (#17)
- GitHub develop 브랜치 생성 후 삭제, 저장소에는 main만 유지
- /handoff·/daily 스킬 추가 PR 생성 (#18)
- /log 위임로그 양식을 목표·프롬프트·결과·검증·수정·배운점으로 변경 (#20)
- README AI 사용 지도를 스킬 표·훅 표로 정리 (#22, #24)
- plan 승인 시 본인 담당 이슈를 보드 In progress에 만드는 plan-issue hook, /issue 스킬, issue_적용방법.md·작업지침서.md 추가 (#24)
- PR 템플릿 Closes 칸·docs/git.md 이슈 연결 규칙 추가, PR 머지 시 이슈 Done 이동 확인 (#28)
- main(배포)·develop(개발 통합, 기본 브랜치)·hotfix 전략과 GitHub ruleset 적용, PR 승인 필수 해제 (#34, #37)
- 팀 문서 변경 PR 반영: 검색 제외 설정(#21), 적용방법.md 삭제(#25), AI 정리글 양식(#33), 기록 삭제 절차·연관 기록(#35)
- Supabase CLI 3.4.0 루트 devDependency 고정 (#41)
- 기록 생성 API POST /api/records와 로컬 Supabase 기본 테이블·RLS·records 버킷 (#43)
- 기록 1개에 파일 최대 10개(record_file), 화면 이름 '제목1…', 큰 jpg·png 클라이언트 축소 함수 (#45)

### 막힌 곳
- PR #18(/handoff·/daily 스킬) 머지 대기 → 팀원 1명 승인 필요 → 해결: 머지됨 (#18)
- main 브랜치 보호 규칙(직접 push 금지·PR 승인 필수) 적용 여부 보류 → 팀 결정 필요 → 해결: main·develop ruleset 적용(삭제·강제 푸시 금지, PR 필수), 승인 필수는 해제 (#34, #37)
- 가공 서버 백그라운드 실행 방식과 동시 처리 개수 미정(docs/open-questions.md) → 팀 결정 필요
- 가공 서버 요청 형식 POST {WORKER_URL}/process { record_id }는 잠정(apps/web/src/lib/worker.ts) → apps/worker Pydantic 모델 정할 때 확정 필요
- compressImageIfNeeded 실제 이미지 축소는 브라우저 Canvas가 필요해 자동 테스트 못 함 → 웹 기록 넣기 화면 연결 때 실제 큰 이미지로 확인 필요
- 쿠키 세션 로그인 경로(getAuthedClient) 미확인 → 웹 구글 로그인(B2) 구현 후 확인
- 데스크톱 수집 화면(screens/01)의 여러 파일 넣기 동작과 API 응답 형식 변경(files·uploads 배열) → 데스크톱 담당 확인 필요
- AI 그룹 추천 '버튼 + 가공 후' 방식이 PRD 원칙 1과 다름 → PRD 작성자 합의 필요(docs/open-questions.md)

### 다음 할 일
- PR #18 리뷰 요청 후 머지
- 이슈 #1 기획 및 설문조사 준비 진행
- apps/web Next.js·Tailwind 설치 시 .prettierrc.json의 tailwindStylesheet 경로 확인(src 폴더 미사용 시 ./apps/web/app/globals.css)과 eslint.config.mjs에 eslint-config-next 추가
- main 브랜치 보호 규칙 적용 여부를 팀과 결정
- 업로드 완료 알림 API: 모든 record_file이 Storage에 있을 때만 queued로 바꾸고 가공 요청 (dev-b-web.md B3 남은 항목)
- 웹 구글 로그인·첫 로그인 기본 그룹·데스크톱 로그인 콜백 (B2)
- 데스크톱 담당에게 POST /api/records 요청·응답 형식(packages/shared create-record.ts) 공유
- 팀원 안내: develop 받은 뒤 npx supabase migration up

## 2026-11-28

### 오늘 한 일
- 디자인 싱크 반영: 'AI 분석하기' 버튼 방식(저장 시 글자 추출·색인만 자동, AI 정리글은 버튼·챗봇 요청 때만), 기록 상세 AI 분석 영역(다시 분석·메모에 옮기기·지우기), 챗봇 분석 요청·기록으로 저장(chat)·AI 추천·FAQ 명세와 분석 상태 칸 migration PR 생성 (#48)
- develop 최신 pull, 루트 npm install(package-lock.json 차이는 되돌림), apps/worker/.venv에 requirements 설치 (pytest 58 통과·1 실패·2 건너뜀)
- 화면 명세(screens 03·04·06·08·09·10·11, spec/README, tasks/dev-b-web)를 화면정의서 v1(시안 v2) 기준으로 정리, AI 추천(버튼 누르면 업로드·가공 후 파일 내용 + 메모로 기존 그룹 추천)·AI 정리글(한 줄 요약 + 핵심 3개)·다시 분석 조건 반영 (#70, 머지됨)
- 남은 확인 필요 6개 결정 반영: 함께 볼 만한 기록(벡터 유사도 0.8 상위 3), 휴지통 없음(삭제 → n개 지우기), 직접 지정 기간(시작일–종료일), 챗봇 AI 추천(FAQ 질문), 로그인(이메일 + Google, 이메일 계정만 Google 연동), 그룹 합치기 (#75)
- 시안 v3 기준 문서 29개 반영: AI 추천 기록 상세로 이동, 다시 분석 10자, AI 활용 꺼짐, 챗봇 새 창·묶음 분석 보고서, v3 로그인 페이지·닉네임, 공통 상태 (#86)
- 웹 공통 디자인 토큰(globals.css)과 Pretendard 나눠 받기 글꼴, 반응형 기준(760/1100px)·iPhone 노치 여백 적용 (#85)

### 막힌 곳
- PR #48 머지 대기 → docs·CLAUDE.md·packages/shared·migrations 변경이라 팀 합의와 데스크톱 담당 확인 필요 → 해결: 머지됨 (#48)
- PRD 5번 '저장하면 요약'과 버튼 방식이 다름 → PRD 작성자 확인 필요 (docs/open-questions.md)
- 데스크톱 말풍선 '받았어요! 정리하고 있어요'(screens/01)가 버튼 방식과 안 맞음 → 데스크톱 담당 문구 조정 필요
- 가공 후 그룹 추천 처리 위치(가공 서버/웹 서버), 분석 결과 기다리는 방식, 챗봇 FAQ 문구·AI 추천 결과 위치 미정 → 팀 결정 필요 → 해결: 그룹 추천은 가공 서버, 챗봇 AI 추천 결과는 대화창 목록 + 빠른 분류 카드에서 수락으로 정함 (#70, #75). 분석 결과 기다리는 방식·FAQ 문구는 남음
- worker pytest `test_엑셀에서_저장한_cp949_csv도_읽는다` 실패 → Windows git이 tests/fixtures/sample_cp949.csv 줄바꿈을 CRLF로 바꾼 것으로 추정, .gitattributes 고정 또는 테스트 수정 필요 (원인 미확인)
- packages/shared `canReanalyze`가 '메모에 옮기기' 뒤에도 '다시 분석'을 켬 → 화면정의서 F-14 기준 코드 수정 필요 (screens/07 확인 필요에 기록)
- 로그인 방식 변경(이메일 + Google 연동)으로 인증 메일 확인 여부, 비밀번호 찾기, 로그인 페이지 시안, 이메일 가입자 표시 이름 미정 → 팀 결정·시안 필요 (docs/open-questions.md) → 해결: 시안 v3 로그인 페이지와 결정(인증 메일 없음, 가입 때 닉네임 2~12자)으로 정함 (#86)
- v3 반영으로 새로 생긴 미결: 자동 가공 전 AI 추천을 눌렀을 때, AI 활용 꺼짐 그룹 거절 오류 코드, 새 비밀번호 설정 화면(v3에 없음), 연결 끊김 띠의 오프라인 보관 약속 → 팀 결정 필요 (docs/open-questions.md, #86)
- suggested_group_id 유지 여부 → 사용자 결정 대기 (AI 추천을 쓰므로 유지 권장)

### 다음 할 일
- AI 분석 API 구현: POST·DELETE /api/records/{id}/analysis, 메모 자동 저장 PATCH /api/records/{id} (명세: f04·f07, apps/web/CLAUDE.md)
- 업로드 완료 알림 API (dev-b-web.md B3 남은 항목)
- 팀원 안내: PR #48 머지 후 npx supabase migration up
- PR #75 머지 확인 (docs/screen-definition·PRD 등 다른 담당자 영역 수정 포함이라 팀 공유)
- 이슈 #65(단순 pull로 자동 생성된 이슈) 닫기
- `canReanalyze` 수정: '메모에 옮기기' 때 analyzed_context도 갱신하는 방식 등 + Vitest 추가
- AI 추천 버튼 흐름 API 설계: 저장 전 기록 생성·업로드 → 가공 서버 추천 결과를 저장 창에 돌려주는 방식 (f03, dev-b-web.md B5)
- PR #85(디자인 토큰)·#86(시안 v3 문서) 머지 확인. #86은 데스크톱·화면정의서·design.md 담당자 영역 수정 포함이라 팀 공유
- `canReanalyze`와 웹 API 409 판단을 '새로 쓴 글자 10자 이상(메모에 옮기기 글 제외)' 규칙으로 수정 + Vitest (위 '메모에 옮기기' 항목을 대체)
- 기록 상세 AI 추천 API 설계: 자동 가공에서 뽑은 글자 + 메모로 기존 그룹 추천 (위 '저장 창 AI 추천' 흐름은 v3 결정으로 폐기, f03·dev-b-web.md B5)
- 실제 iPhone·안드로이드에서 토큰·글꼴 확인 (dev 서버, pb-safe·min-h-dvh)
