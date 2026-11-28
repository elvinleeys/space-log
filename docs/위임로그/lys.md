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

### /log 위임로그 양식 변경
- 목표: 위임로그를 AI에게 맡긴 지시·검증·직접 수정 중심으로 남기기
- 프롬프트: 위임로그 양식을 목표·프롬프트·결과·검증·수정·배운점으로 설정하게 /log 스킬 수정
- 결과: .claude/skills/log/SKILL.md 양식 6칸으로 변경, /daily 설명 수정 (#20)
- 검증: 이번 /daily 실행으로 새 양식 기록 확인
- 수정: 없음
- 배운점: 기록 양식은 스킬 하나만 바꾸면 /daily까지 따라온다

### 계획 승인 시 이슈 자동 생성 hook
- 목표: plan mode 계획을 승인하면 코드 작성 전에 본인 담당 이슈가 보드 In progress 칸에 생기게 하기
- 프롬프트: plan 확정 후 auto mode로 코드 작성 전 GitHub project In progress에 본인 assignee 이슈를 발행하는 스킬·훅·자동화 방법
- 결과: .claude/hooks/plan-issue.mjs(PostToolUse ExitPlanMode) + settings.json, 비개발자용 issue_적용방법.md (#24)
- 검증: 예시 계획으로 직접 실행해 테스트 이슈 #23 생성·In progress 확인 후 닫음, 이후 실제 승인으로 #42·#44 생성 확인
- 수정: hook 완성 후 쓰기 권한 안내와 적용 방법을 루트 문서에 쉽게 쓰라는 요청 반영
- 배운점: 반드시 일어나야 하는 일은 스킬보다 hook이 확실하다

### 팀원 지정 이슈 발행 /issue 스킬
- 목표: 매핑된 팀원 한 명을 담당자로 이슈를 발행
- 프롬프트: 현재 매핑된 상대 중 한 명을 지정하여 issue를 발행하는 스킬 생성
- 결과: .claude/skills/issue/SKILL.md (문서 약어·git 이름·GitHub 계정 매핑, 칸 미지정 시 Backlog, 발행 전 확인) (#24)
- 검증: 안 함 (담당자에게 알림이 가서 실제 발행은 하지 않음)
- 수정: 없음
- 배운점: git user.name과 GitHub 계정이 다른 팀원이 있어 매핑 표에 계정 칸이 필요하다

### 작업 지침서 검토·보완과 README AI 사용 지도
- 목표: 비개발자도 따라 할 수 있는 작업 순서 문서와 스킬·훅 현황 정리
- 프롬프트: 작업지침서.md 빠진 부분 검토(수정 없이 보고) 후 반영, README에 스킬·훅을 별도 표로 정리
- 결과: 작업지침서.md(처음 준비·매일 순서·/issue·금지 사항), README 스킬 표·훅 표 분리 (#22, #24)
- 검증: 스킬·훅 파일과 설정을 직접 대조
- 수정: 승인 화면 실제 문구는 확인하지 못해 일반 표현으로 둠
- 배운점: 먼저 보고만 받고 반영하면 문서 범위를 사람이 통제하기 쉽다

### PR 머지 시 이슈 Done 자동 이동 확인과 PR 템플릿
- 목표: plan hook이 만든 이슈가 PR 머지 후 Done으로 가는지 확인
- 프롬프트: 수정 없이 보고 → 보완해서 PR 템플릿에 Closes 칸 추가
- 결과: Project 워크플로 Item closed 확인, .github/pull_request_template.md + docs/git.md 이슈 연결 규칙 (#28)
- 검증: 닫은 테스트 이슈 #23이 Done인지 확인, 이후 #45 머지로 #44가 Done 이동 확인
- 수정: gh pr create --body는 템플릿이 적용되지 않아 docs/git.md에도 규칙 추가
- 배운점: Closes #N은 기본 브랜치에 머지될 때만 동작한다

### main·develop·hotfix 브랜치 전략과 GitHub 보호 규칙
- 목표: main은 배포, develop은 개발 통합으로 나누고 두 브랜치가 머지 후 삭제되지 않게 하기
- 프롬프트: 수정 사항 보고 후 응답하면 반영, hotfix 규칙 적용, GitHub 설정 변경 허용, develop→main은 merge commit
- 결과: develop 생성·기본 브랜치 변경, ruleset 2개(삭제·강제 푸시 금지, PR 필수), prune hook에서 main·develop 제외, docs/git.md·CLAUDE.md 등 반영 (#34), 이후 승인 필수 해제 (#37)
- 검증: ruleset 조회, pull 후 로컬 develop·main이 지워지지 않음 확인
- 수정: 설정 명령이 입력 대기로 멈춰 중단 후 재확인, 승인 조건은 사용자 요청으로 0명으로 변경
- 배운점: 기본 브랜치를 develop으로 해야 Closes #N과 브랜치 보호가 함께 맞는다

### 외부 스킬 설치 (find-skills, Supabase)
- 목표: Supabase 로컬 DB로 API를 단계적으로 만드는 데 맞는 스킬 찾기
- 프롬프트: find-skill 설치, supabase cli로 로컬 DB API 작업을 차근차근 질문하며 완성하는 스킬 찾기
- 결과: ~/.claude/skills에 find-skills, supabase, supabase-postgres-best-practices 설치 (저장소 변경 없음)
- 검증: 설치 후 SKILL.md 내용과 실행 파일 유무 직접 확인
- 수정: 없음
- 배운점: 한 번에 다 해 주는 스킬보다 이미 있는 스킬과 조합하는 편이 낫다

### Supabase CLI 버전 고정 설치
- 목표: 팀원 모두 같은 Supabase CLI 버전 사용
- 프롬프트: supabase cli 설치 → 클라우드로 갈 건데 고정 설치가 필요한지 질문 → 고정 설치 후 PR
- 결과: 루트 devDependency supabase 3.4.0 (#41)
- 검증: npx supabase --version 3.4.0
- 수정: 없음
- 배운점: CLI는 클라우드 전환 후에도 migration 반영·타입 생성에 계속 쓰인다

### 기록 생성 API (POST /api/records)
- 목표: UI 확정 전, 로컬 Supabase로 수집 흐름 첫 API 완성
- 프롬프트: 명세에서 가장 먼저 만들 endpoint를 정하고 질문·선택지로 명세를 구체화한 뒤 별도 브랜치에서 구현
- 결과: Next.js 최소 세팅, migration(app_user·record_group·information_record·RLS·가입 트리거·records 버킷), packages/shared 검사·타입, route.ts (#43, 이슈 #42)
- 검증: 테스트 사용자 2명으로 curl 정상·오류·권한 케이스, 실제 업로드, db advisors, Vitest 14개, lint·tsc
- 수정: 질문 11개 답 반영, user 테이블을 app_user로 변경, Prettier가 문서·config까지 포맷한 것을 되돌림
- 배운점: 명세 확인 질문을 코드 전에 몰아서 하면 구현 중 되돌릴 일이 줄어든다

### 기록 1개에 파일 여러 개 + 큰 이미지 줄이기
- 목표: 한 기록에 파일 여러 개, 화면 이름 '제목1, 제목2…', 큰 파일은 줄여서 저장
- 프롬프트: #43의 sub-issue로, 제목이 비면 파일 이름을 따라가고 큰 파일은 줄이는 방법까지 질문으로 하나씩 정해 반영 (PR이 이미 머지된 점 고려)
- 결과: 새 migration record_file, files 배열 API, displayFileName·displayRecordTitle, compressImageIfNeeded (#45, 이슈 #44 → #42 sub-issue)
- 검증: migration up 데이터 보존·db reset, 파일 3개 실제 업로드, 개수·합계 초과·형식 위조·권한·삭제 연쇄 확인, Vitest 32개
- 수정: 빈 제목에 첫 파일 이름을 저장하면 '제목1' 규칙과 충돌해 저장하지 않고 화면에서 보여 주도록 변경, 머지된 migration은 고치지 않고 새로 추가
- 배운점: 이미 머지된 migration은 수정하지 말고 새 migration으로 바꾼다

### 팀 문서 변경 PR 정리
- 목표: 작업 폴더에 있던 문서 변경을 내용 확인 후 PR로 반영
- 프롬프트: 지금까지 변경된 내역 PR / 커밋 / develop으로 PR
- 결과: 챗봇·MCP 검색 제외(#21), 적용방법.md 삭제(#25), AI 정리글 양식·그룹 추천 방식(#33), 기록 삭제 절차·연관 기록(#35)
- 검증: diff로 삭제된 줄 확인
- 수정: #35에서 실수로 지워진 브랜치 전략 결정 줄을 되살림
- 배운점: 남이 만든 변경도 올리기 전에 삭제된 줄을 꼭 본다

## 2026-11-28

### 디자인 싱크 반영: AI 분석하기 버튼·기록 상세·챗봇
- 목표: 디자인팀과 맞춘 'AI 분석하기' 버튼, 기록 상세 AI 분석 영역, 챗봇 분석 요청이 문서에 없어서 문서와 필요한 최소 DB·API를 맞추기
- 프롬프트: 이미지(기록상세_1~4, 챗봇)대로 버튼 클릭 시 분석이 시작되도록 문서 반영 계획 수립, 부족한 정보는 질문·선택지로, 보고 후 응답으로 실행, 브랜치를 옮기고 이미지는 반영 후 삭제해 PR에 올리지 않기
- 결과: screens/07·08 재작성, f02·f03·f04·f07·f09·R4·database.md·glossary·architecture·CLAUDE.md 갱신, migration(analysis_status·analyzed_at·analyzed_context·analysis_moved_at, record_type chat), packages/shared 버튼 판단 함수 (#48, 이슈 #47)
- 검증: db reset으로 migration 3개 적용, db advisors, curl(파일+메모 201·information_content 400·chat 400), Vitest 45개, lint·tsc, 옛 '자동 요약' 문구 검색, PR에 이미지 0개 확인
- 수정: 질문 13개 답 반영, 자동 요약 vs 버튼 검토 보고 후 자동 색인 + 버튼 분석으로 정함, 가공 서버 그룹 추천 위치를 단정하지 않고 확인 필요로 되돌림, 남아 있던 개발 서버 정리
- 배운점: 디자인 이미지는 화면만이 아니라 처리 시점(자동/버튼) 같은 서버 흐름까지 바꾸므로 먼저 흐름 차이를 표로 확인한다

### develop pull·의존성 설치
- 목표: GitHub 변경 내역을 받아오고 데스크톱·worker를 돌릴 수 있게 의존성 설치
- 프롬프트: github 변경내역 pull 받아줘(3회), npm install 해줘, package-lock.json은 되돌려줘, worker requirements 설치해줘
- 결과: develop을 f57d8af → b210dab로 fast-forward, 루트 npm install(51개 추가), apps/worker/.venv 생성 후 requirements.txt 설치
- 검증: git status 확인, worker pytest 58 통과·1 실패(cp949 csv 줄바꿈 추정)·2 건너뜀, tesseract 미설치 확인
- 수정: npm install로 생긴 package-lock.json "peer": true 삭제 16줄을 npm 버전 차이로 보고 되돌림
- 배운점: Windows에서 받은 테스트 샘플 파일은 줄바꿈 변환으로 테스트가 깨질 수 있다

### 시안 v2·화면정의서 기준 문서 정리 + AI 추천·AI 분석 결정 반영
- 목표: 오늘 들어온 시안 v2·화면정의서와 기존 명세의 차이를 찾아, 확정 결정(AI 추천 방식, AI 분석 형식, 버튼 규칙)과 함께 기존 문서에 반영
- 프롬프트: 수집 시 AI 그룹 추천 제외·기본 그룹 미분류·AI 분석은 요약 1줄 + 핵심 3줄·버튼 규칙을 반영해 pull 전 문서와 비교·반영하는 계획 세우기, 이후 "AI 추천은 진행하되 버튼 클릭 시 가공 서버가 파일 내용 + 메모로 기존 그룹 중 추천"으로 정정
- 결과: Explore 에이전트로 차이 목록 작성 → f03·f04·f05·01·05·07·database.md·glossary·decisions·open-questions·CLAUDE.md·worker CLAUDE.md 수정, 화면 명세는 하위 에이전트가 03·04·06·08·09·10·11·README·tasks 정리 (#70, 머지됨)
- 검증: docs 전체에서 `이럴 때 다시 보세요|use_when|핵심 1줄` 검색, git diff 검토
- 수정: 처음 계획한 "AI 추천 제거"를 사용자 정정에 따라 "버튼 → 업로드·가공 후 추천"으로 바꾸고 이름 추천만 제외, 화면정의서 용어를 '한 줄 요약 · 핵심 내용 3개'로 통일
- 배운점: 계획 단계에서 질문으로 범위를 좁혀도 실행 직전 정정이 들어오므로 plan 승인 전에 핵심 결정을 한 번 더 확인한다

### 남은 확인 필요 항목 인터뷰로 결정
- 목표: 문서에 남은 [확인 필요]를 질문·선택지로 채우기
- 프롬프트: /find-skills로 문서 빈틈을 질문으로 채우는 스킬 찾기 → /agent-skills:interview-me "남은 확인 필요 항목 채워줘" → "1번으로 PR #70에 반영해줘"
- 결과: grill-me(mattpocock) 등 스킬 후보 확인, interview-me로 6개 결정(함께 볼 만한 기록, 휴지통 없음, 기간 시작–종료, 챗봇 AI 추천 FAQ, 이메일 + Google 로그인, 그룹 합치기) → decisions·open-questions·02·03·04·06·08·11·f01·f03·f05·R1·화면정의서 반영. #70이 이미 머지되어 후속 PR 생성 (#75)
- 검증: open-questions diff 확인, gh pr view로 #70 머지 상태 확인
- 수정: 로그인은 처음 추측(Google만)이 틀려 이메일 자체 로그인 + Google 연동으로 다시 정리
- 배운점: 반영 전 PR 상태(머지 여부)를 먼저 확인해야 브랜치를 다시 만들지 않는다

### 시안 v3 기준 문서 반영
- 목표: 최신 시안 spacelog-prototype-v3.html·login-v3.html과 다른 문서를 찾아 반영
- 프롬프트: "spacelog-prototype-v3.html이 최신 디자인 버전이니까 이를 분석해서 문서와 다른 부분을 반영 … 계획을 보고해줘"
- 결과: Explore 에이전트가 __bundler 묶음 HTML을 풀어 v2·화면정의서·결정과 비교 → 충돌 8개를 질문으로 결정(AI 추천 기록 상세 이동, 다시 분석 10자, 기간 '전체', 표기 '핵심 1줄 + 요약 3개', 챗봇 새 창·보고서, AI 활용 꺼짐, Google 로그인 계정 연동 줄 숨김, 인증 메일 없음) → 하위 에이전트가 별도 작업 폴더에서 문서 29개 수정, apps/web/CLAUDE.md 낡은 규칙은 직접 수정 (#86)
- 검증: 옛 표현 grep(저장 전·AI 추천' 버튼·한 줄 요약 · 핵심 내용·크게 보기·읽은 기록·연동됨), 07 diff 직접 확인
- 수정: 오늘 앞서 정한 '저장 창 AI 추천'·'한 줄 요약 · 핵심 내용 3개'를 사용자 결정으로 되돌림, design.md는 본문 대신 메모만 추가
- 배운점: 디자인 문서(design.md)의 [v3] 표시가 실제 코드 차이와 달라 시안 HTML을 기준으로 비교해야 한다

### 웹 디자인 토큰과 글꼴
- 목표: design.md 값을 apps/web/src/app/globals.css 공통 토큰으로 넣고, 반응형·모바일(iOS·안드로이드)·배포 시 글꼴 적용 검토
- 프롬프트: "docs/design/design.md를 이용해 global.css에 공통으로 사용될 디자인 토큰을 반영", "반응형 웹을 고려하여 작성된 토큰인지 검토하고, 글꼴의 경우 배포할 시 적용될 것인지 검토해줘", "권장대로 고치고 PR 2개 올려줘"
- 결과: Tailwind v4 @theme 토큰(색·그룹 색 7쌍·글자·모서리·그림자), compact 760·wide 1100 화면 폭 기준, pt-safe·pb-safe·bottom-safe-[n], viewport(viewport-fit=cover·theme-color·color-scheme), min-h-dvh, pretendard 나눠 받기 CSS (#85)
- 검증: npm run build -w apps/web, 빌드 CSS에서 @font-face 92개·meta 태그 확인, Tailwind compile로 클래스 생성 확인, eslint, Vitest 118개 통과. 실제 기기·dev 서버 확인은 안 함
- 수정: 처음 쓴 next/font/local은 2MB 파일을 매 페이지 미리 받고 node_modules 상대 경로가 깨지기 쉬워 나눠 받기 CSS로 교체, package-lock.json의 "peer": true 삭제는 되돌림
- 배운점: 한글 가변 글꼴은 전체 파일이 커서 모바일에서는 글자 범위별 나눠 받기가 낫다
