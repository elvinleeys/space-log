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

### 막힌 곳
- PR #48 머지 대기 → docs·CLAUDE.md·packages/shared·migrations 변경이라 팀 합의와 데스크톱 담당 확인 필요 → 해결: 머지됨 (#48)
- PRD 5번 '저장하면 요약'과 버튼 방식이 다름 → PRD 작성자 확인 필요 (docs/open-questions.md)
- 데스크톱 말풍선 '받았어요! 정리하고 있어요'(screens/01)가 버튼 방식과 안 맞음 → 데스크톱 담당 문구 조정 필요
- 가공 후 그룹 추천 처리 위치(가공 서버/웹 서버), 분석 결과 기다리는 방식, 챗봇 FAQ 문구·AI 추천 결과 위치 미정 → 팀 결정 필요

### 다음 할 일
- AI 분석 API 구현: POST·DELETE /api/records/{id}/analysis, 메모 자동 저장 PATCH /api/records/{id} (명세: f04·f07, apps/web/CLAUDE.md)
- 업로드 완료 알림 API (dev-b-web.md B3 남은 항목)
- 팀원 안내: PR #48 머지 후 npx supabase migration up
