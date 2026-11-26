# 프로젝트
정보 스크랩 후 AI가 정리·분류하고, 잊힌 기록을 다시 보여주는 서비스
- 데스크톱 앱(apps/desktop): 수집 + 열람. PC 작업 중 빠른 수집에 특화
- 웹(apps/web): 수집 + 열람. 우주 공간 화면에서 스크랩 탐색·재발견
- 가공 서버(apps/worker): 텍스트 추출, AI 요약·키워드, 임베딩

# 구조
npm workspaces 모노레포 (apps/worker는 Python이라 npm 대상 아님)
- apps/desktop: Electron (main / preload / renderer)
- apps/web: Next.js, 화면 + API (업로드 권한 발급, 가공 요청 전달, 조회·검색)
- apps/worker: Flask (Python), 가공 전담
- packages/shared: 공통 타입, 수집(업로드) 로직, storage·vector 인터페이스 (TS)
- packages/ui: 데스크톱·웹 공용 컴포넌트
- supabase/migrations: DB 테이블 변경 기록

# 수집 흐름 (데스크톱·웹 공통)
1. 클라이언트 → apps/web API: 스크랩 생성 요청, 업로드 권한 받음 (status: uploading)
2. 클라이언트 → Supabase Storage: 파일 직접 업로드 (텍스트·링크는 생략)
3. 클라이언트 → apps/web API: 업로드 완료 알림 (status: queued)
4. apps/web → apps/worker: 가공 요청 전달 후 즉시 응답
5. apps/worker: 가공 후 status를 done 또는 failed로 변경
- 1~3단계는 packages/shared의 수집 함수만 사용. 앱마다 업로드 코드 따로 작성 금지
- processing·queued 상태도 화면에 표시 (예: 형성 중인 행성)

# 데이터
- Supabase DB: 기준 데이터. 테이블 구조가 TS와 Python 사이의 계약
- Qdrant: 검색용 색인. Supabase 데이터로 언제든 재생성 가능해야 함
- 파일: Supabase Storage에 저장, DB에는 경로만 저장
- 스토리지는 추후 R2로 교체 가능하도록 packages/shared/storage 인터페이스로만 접근
- TS 코드의 외부 서비스 SDK(Supabase, Qdrant)는 packages/shared 안에서만 import
- API 키·비밀값은 서버(apps/web, apps/worker) 환경변수에만. 데스크톱 앱·브라우저 코드에 넣지 말 것
- 테이블 구조 변경 시 migration, apps/web 타입, apps/worker 코드를 같은 PR에서 함께 수정

# 명령어
- npm install: 루트에서 한 번만 실행 (각 폴더에서 따로 설치 금지)
- npm run dev -w apps/web: 웹 개발 서버
- npm run dev -w apps/desktop: 데스크톱 앱 실행
- npm run lint: 전체 린트
- npm run test: Vitest 테스트
- apps/worker 명령어는 apps/worker/CLAUDE.md 참고

# 코드 스타일
- 웹·데스크톱은 TypeScript, 가공 서버는 Python
- 스타일은 Tailwind CSS만 사용, 인라인 style·별도 CSS 파일 추가 금지
- 두 앱에서 쓰는 컴포넌트는 packages/ui에 두고 앱 폴더에 복사 금지

# 워크플로우
- main에 직접 커밋·푸시 금지. 작업은 항상 개인 브랜치에서 진행
- 브랜치 이름: {접두어}/{유형}/{기능명}  예) minji/feat/pdf-upload
  - 유형은 커밋 접두어와 동일: feat / fix / chore / docs / refactor / test
  - 기능명은 영어 소문자 + 하이픈(kebab-case)
  - 접두어: CLAUDE.local.md의 "브랜치 접두어" 값을 사용
  - 값이 없으면 git config user.name을 소문자로 바꾸고 공백을 하이픈으로 바꿔 사용
  - 접두어를 알 수 없으면 브랜치를 만들기 전에 사용자에게 물어볼 것
- 작업 완료 후 main으로 PR 생성, 최소 1명 승인 후 머지
- PR 설명에 변경 내용, 변경 이유, 확인 방법을 적을 것
- 커밋 메시지: feat / fix / chore / docs / refactor / test 접두어 + 한국어 설명
  예) feat: PDF 업로드 후 텍스트 추출 추가
- packages/shared 수정 시 Vitest, apps/worker 수정 시 pytest 테스트 함께 추가·수정
- 커밋 전 npm run lint, npm run test 통과 확인
- 이 파일(CLAUDE.md) 수정은 팀 합의 후 PR로만 반영
- 개인 설정은 CLAUDE.local.md에 작성 (.gitignore 대상)