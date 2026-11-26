# 작업 분담

개발자 2명이 데스크톱 앱과 웹으로 나눈다. FastAPI 가공 서버(apps/worker)는 웹 담당에 포함한다.
디자이너 2명의 작업은 아직 나누지 않았다.

| 담당 | 파일 | 맡는 폴더 |
| --- | --- | --- |
| 개발자 A · 데스크톱 | [dev-a-desktop.md](dev-a-desktop.md) | apps/desktop |
| 개발자 B · 웹 | [dev-b-web.md](dev-b-web.md) | apps/web, apps/worker |
| 함께 | 이 파일 아래 '함께 할 일' | packages/shared, packages/ui, supabase/migrations |

## 진행 순서 (제안)
1. 함께 할 일: 두 사람이 같은 약속 위에서 시작하도록 공통 기반을 먼저 만든다
2. 수집 흐름 끝까지: 데스크톱에서 넣은 기록이 Storage → 가공 서버(FastAPI) → DB·Qdrant까지 가는 것을 먼저 완성한다. 시연 가능한 첫 단위다
3. 찾기: 메인 우주, 행성 패널, 목록, 상세, 물어보기
4. P1: 연결, 블랙홀, 재발견 메모 (설문 결과로 근거 판단)

## 함께 할 일 (제안)
- 모노레포 세팅: 루트 package.json의 workspaces, Vitest, 린트 설정
- Supabase 프로젝트, 구글 로그인 설정, 기본 테이블 migration (docs/database.md의 user·record_group·information_record)
- packages/shared/src/types: 기록·그룹·처리 상태 타입
- 수집 API 약속: 기록 생성·업로드 권한·완료 알림의 요청과 응답 형식을 먼저 정해 packages/shared에 타입으로 둔다. 이게 정해져야 데스크톱이 웹 API 완성 전에도 개발할 수 있다
- packages/shared/src/collect의 주 담당은 데스크톱(A), 리뷰는 웹(B)으로 두는 것을 제안한다 [확인 필요]

## 작업량 메모
웹 담당(B)의 범위가 데스크톱(A)보다 훨씬 크다. 데스크톱 작업이 끝나면 A가 웹의 일부(예: 기록 넣기 창, 설정 화면)를 넘겨받는 식으로 조정할지 팀에서 정한다 [확인 필요].

## Claude Code로 작업할 때
- 작업 하나를 시작할 때: "docs/tasks/dev-a-desktop.md의 A4를 하자. 관련 명세를 먼저 읽고 계획부터 보여 줘"
- 명세의 [확인 필요]를 만나면 Claude가 선택지를 주고 묻도록 CLAUDE.md에 적혀 있다. 답을 정하면 docs/open-questions.md에서 지우고 docs/decisions.md에 한 줄을 추가한다
- 끝난 작업은 아래 목록의 체크 박스를 PR에서 함께 체크한다
