## 2026-11-27

### 오늘 한 일
- 가공 서버 FastAPI 전환 문서와 develop 브랜치 전략 Git 규칙(docs/git.md) 머지 (#15)
- Prettier·ESLint 설정, Claude 코드 수정 시 자동 포맷 hook, 세션 시작 상태 hook 추가 및 main 단일 브랜치 전략으로 변경 머지 (#17)
- GitHub develop 브랜치 생성 후 삭제, 저장소에는 main만 유지
- /handoff·/daily 스킬 추가 PR 생성 (#18)

### 막힌 곳
- PR #18(/handoff·/daily 스킬) 머지 대기 → 팀원 1명 승인 필요
- main 브랜치 보호 규칙(직접 push 금지·PR 승인 필수) 적용 여부 보류 → 팀 결정 필요
- 가공 서버 백그라운드 실행 방식과 동시 처리 개수 미정(docs/open-questions.md) → 팀 결정 필요

### 다음 할 일
- PR #18 리뷰 요청 후 머지
- 이슈 #1 기획 및 설문조사 준비 진행
- apps/web Next.js·Tailwind 설치 시 .prettierrc.json의 tailwindStylesheet 경로 확인(src 폴더 미사용 시 ./apps/web/app/globals.css)과 eslint.config.mjs에 eslint-config-next 추가
- main 브랜치 보호 규칙 적용 여부를 팀과 결정
