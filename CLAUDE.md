# 프로젝트
Spacelog: 흩어진 기록을 한곳에 쉽게 저장하고, 필요할 때 쉽게 찾게 해 주는 개인 기록 서비스
- 데스크톱 앱(apps/desktop): 수집 전용
- 웹(apps/web): 수집 + 찾기(우주·목록·검색·AI 챗봇) + 그룹·설정 관리
- 가공 서버(apps/worker): 글자 추출, 임베딩(자동), AI 요약('AI 분석하기'·챗봇 요청 때만)

# 구조
npm workspaces 모노레포. workspaces는 ["apps/desktop", "apps/web", "packages/*"]로 명시 (apps/worker는 Python이라 제외)
- apps/desktop: Electron (main / preload / renderer)
- apps/web: Next.js + Tailwind CSS. 화면 + 서버 API (기록 생성, 업로드 권한, 가공 요청 전달, 조회·검색, 챗봇)
- apps/worker: FastAPI (Python). 가공 전담
- packages/shared: 공통 타입, 수집 함수, storage·vector 인터페이스 (TS)
- packages/ui: 데스크톱·웹 공용 컴포넌트
- supabase/migrations: DB 테이블 변경 기록
- docs/: 명세, 데이터 구성, 결정 기록, 작업 목록, Git 규칙

# 문서
- 용어: @docs/glossary.md
- 기능 작업 전 docs/spec/README.md에서 해당 화면·기능 명세를 찾아 먼저 읽을 것
- 전체 흐름: docs/architecture.md
- DB·Storage·Qdrant 구조: docs/database.md (DB 관련 폴더 작업 시 .claude/rules/database.md가 안내)
- 구조나 기술을 바꾸기 전 docs/decisions.md의 기존 결정과 이유를 확인
- 명세에 [확인 필요]가 있으면 추정해서 구현하지 말고, 선택지를 주고 사용자에게 물어볼 것. 미결 목록: docs/open-questions.md
- 코드와 문서가 다르면 코드를 기준으로 판단하고, 차이를 사용자에게 알릴 것
- 담당 범위: docs/tasks/. 다른 담당자 영역을 고쳐야 하면 먼저 사용자에게 알릴 것

# Git 작업
- 브랜치 생성, 커밋, PR 작업 전 docs/git.md를 읽고 따를 것
- main·develop에 직접 커밋·푸시 금지. 작업 브랜치는 develop에서 만들고 develop으로 PR

# 수집 흐름 (데스크톱·웹 공통)
1. 클라이언트 → apps/web API: 기록 생성 요청, 업로드 권한 받음 (status: uploading). 파일 없는 기록(메모·하이라이트·URL·영상 링크)은 바로 queued가 되고 4단계로 간다
2. 클라이언트 → Supabase Storage: 파일 직접 업로드 (메모·하이라이트·URL·영상 링크는 생략)
3. 클라이언트 → apps/web API: 업로드 완료 알림 (status: queued)
4. apps/web → apps/worker: 가공 요청 전달 후 즉시 응답
5. apps/worker: 글자 추출 + 원문 조각 벡터 후 status를 done 또는 failed로 변경 (AI 요약은 하지 않음)
- AI 분석(AI 정리글)은 저장 흐름과 별개. 기록 상세의 'AI 분석하기'·챗봇 요청 → apps/web API → apps/worker (analysis_status: none → analyzing → done/failed)
- 저장 창에서 'AI 추천'을 누르면 저장 전에 1~5단계를 먼저 하고('분류 안 된 기록'), 가공 서버가 뽑은 글자 + 메모로 기존 그룹 중 하나를 추천한다. 그룹은 사용자가 저장을 눌러야 확정된다
- 1~3단계는 packages/shared의 수집 함수만 사용. 앱마다 업로드 코드를 따로 작성하지 말 것

# 데이터 원칙
- Supabase DB가 기준 데이터. Qdrant는 DB와 Storage로 다시 만들 수 있는 검색 색인
- 출처 링크(source_url)가 있는 파일은 가공 성공(done) 후 Storage 원본을 지우고 출처 링크로 본다. 출처 링크가 없는 파일(내 컴퓨터에서 올린 파일, 화면 캡처)은 원본을 유지한다. 가공에 실패한 파일은 지우지 않는다
- URL·영상 링크의 원문 글은 저장하지 않는다 (원문 링크만 저장)
- 지원 파일: csv, txt, md, jpeg, jpg, png, svg, HTML, PDF. 파일 1개 10MB까지
- TS 코드의 Supabase SDK는 packages/shared 안에서만 import. 예외: apps/web 서버 코드는 apps/web/src/lib/supabase/server.ts 한 곳에서만 import (비밀키·쿠키 세션 때문). Qdrant SDK는 키가 필요하므로 apps/web 서버 코드에서만 import
- API 키·비밀값은 서버(apps/web 서버 코드, apps/worker)의 환경변수에만. 데스크톱 앱·브라우저 코드에 넣지 말 것
- 테이블 구조를 바꾸면 migration, docs/database.md, apps/web 타입, apps/worker 코드를 함께 수정

# 명령어
- npm install: 루트에서 한 번만 실행 (각 폴더에서 따로 설치 금지)
- npm run dev -w apps/web: 웹 개발 서버
- npm run dev -w apps/desktop: 데스크톱 앱 실행
- npm run lint: 전체 린트
- npm run test: Vitest 테스트
- apps/worker 명령어는 apps/worker/CLAUDE.md 참고
- 스크립트 이름은 package.json과 다르면 package.json 기준으로 고칠 것

# 코드 스타일
- 웹·데스크톱은 TypeScript, 가공 서버는 Python
- 스타일은 Tailwind CSS만 사용, 인라인 style·별도 CSS 파일 추가 금지
- 두 앱에서 쓰는 컴포넌트는 packages/ui에 두고 앱 폴더에 복사 금지

# 테스트
- packages/shared 수정 시 Vitest, apps/worker 수정 시 pytest 테스트를 함께 추가·수정

# 개인 설정
- 개인 설정은 CLAUDE.local.md에 작성 (.gitignore 대상)