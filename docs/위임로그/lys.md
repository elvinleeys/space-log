## 2026-11-27

### 구현한 기능
- docs/git.md로 Git 규칙 분리, main 배포·develop 개발 통합 전략 작성 후 GitHub에 develop 브랜치 생성·삭제 방지 보호 적용 (#15)
- .prettierrc.json·prettier-plugin-tailwindcss·eslint.config.mjs 설정, Claude 코드 수정 시 Prettier→ESLint 자동 실행하는 format hook 추가 (#17)
- 세션 시작 시 현재 브랜치·할당 이슈·main 대비 뒤처짐을 알려주는 session-status hook 추가 (#17)
- develop 브랜치 삭제, docs/git.md를 main 단일 브랜치 전략으로 변경 (#17)
- /handoff 인수인계 스킬과 기록 스킬 4개를 한 번에 실행하는 /daily 스킬 추가 (#18)

### 문제와 해결
- prettierrc.json 파일명에 점이 없어 Prettier가 설정을 못 읽음 → .prettierrc.json으로 이름 변경
- tailwindStylesheet 경로의 CSS 파일이 없으면 Prettier 전체가 실패 → apps/web/** overrides에만 경로 지정
- 루트 package.json·.gitignore가 없어 패키지 설치 불가·node_modules 커밋 위험 → package.json(workspaces)·.gitignore 생성
- 기존 prune-merged-branches hook의 빈 catch 블록 ESLint 오류 → 주석 추가로 수정
- 머지 후 자동 삭제 설정 때문에 develop→main 머지 시 develop이 지워질 위험 → develop 삭제 방지 보호 적용 (이후 develop 자체 제거)
- GitHub PR 검색 날짜가 UTC라 한국 시간 새벽 PR이 오늘 목록에서 누락 → 어제부터 검색 후 로컬 날짜로 필터
