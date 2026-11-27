# space-log

## AI 사용 지도

### 스킬 (`.claude/skills/`)

| 부분 | 만든 도구 | 쓴 프롬프트/스킬 | 사람이 결정한 것 |
| --- | --- | --- | --- |
| 완료 기능 기록 | Claude Code | `/readme` | 오늘 feat 커밋만 `docs/readme/<본인>.md`에 기록 |
| 위임로그 | Claude Code | `/log` | 기록 양식: 목표·프롬프트·결과·검증·수정·배운점 |
| 인수인계 | Claude Code | `/handoff` | 오늘 한 일·막힌 곳·다음 할 일로 정리 |
| prompt 기록 | Claude Code | `/prompt` | 보낸 prompt 원문을 날짜별로 기록 |
| 하루 마무리 | Claude Code | `/daily` | 4개 스킬을 순서대로 한 번에 실행 (`/readme` → `/log` → `/handoff` → `/prompt`) |
| 팀원 이슈 발행 | Claude Code | `/issue` | 매핑된 팀원 1명을 담당자로 지정, 보드 칸 미지정 시 Backlog, 발행 전 확인 |

### 훅 (`.claude/hooks/`)

| 부분 | 실행 시점 | 훅 파일 | 사람이 결정한 것 |
| --- | --- | --- | --- |
| .env 유출 차단 | PreToolUse (Bash·PowerShell) | `block-env.mjs` | `git add·commit·push`에 `.env` 계열이 있으면 차단, `.env.example`만 허용 |
| 자동 포맷 | PostToolUse (Write·Edit) | `format.mjs` | 코드 파일 수정 시 Prettier → ESLint `--fix`, 못 고친 오류는 Claude가 바로 수정 |
| 머지된 브랜치 정리 | PostToolUse (Bash·PowerShell) | `prune-merged-branches.mjs` | `git pull·fetch` 후 원격에서 지워진 로컬 브랜치를 안전 삭제(`-d`)만 |
| 계획 승인 시 이슈 생성 | PostToolUse (ExitPlanMode) | `plan-issue.mjs` | 계획 제목·본문으로 이슈 생성, 담당자 본인, 보드 In progress 칸 (설정법: `issue_적용방법.md`) |
| 세션 시작 안내 | SessionStart | `session-status.mjs` | 현재 브랜치, 나에게 할당된 이슈, develop보다 뒤처진 커밋 수 표시 |
