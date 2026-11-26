# Git 규칙

## 브랜치 구조
| 브랜치 | 용도 | 직접 커밋·푸시 | 삭제 |
|---|---|---|---|
| main | 기준 브랜치. 모든 작업 브랜치의 PR이 모이는 곳 | 금지 | 금지 |
| 작업 브랜치 | 기능·수정 단위 개인 작업 | 허용 | PR 머지 후 삭제 |

## 작업 브랜치
- 작업은 항상 최신 main에서 새 작업 브랜치를 만들어 진행한다
- 브랜치 이름: {접두어}/{유형}/{기능명}  예) minji/feat/pdf-upload
  - 유형은 커밋 접두어와 동일: feat / fix / chore / docs / refactor / test
  - 기능명은 영어 소문자 + 하이픈(kebab-case)
  - 접두어: CLAUDE.local.md의 "브랜치 접두어" 값을 사용
  - 값이 없으면 git config user.name을 소문자로 바꾸고 공백을 하이픈으로 바꿔 사용
  - 접두어를 알 수 없으면 브랜치를 만들기 전에 사용자에게 물어볼 것
- PR이 머지되면 작업 브랜치는 GitHub에서 자동 삭제된다. 로컬 브랜치도 함께 정리한다
- main은 어떤 경우에도 삭제하지 않는다

## 커밋
- 커밋 메시지: 유형 접두어 + 한국어 설명  예) feat: PDF 업로드 후 텍스트 추출 추가
- 커밋 전 npm run lint, npm run test 통과 확인

## PR
- 작업 브랜치 → main으로 PR 생성, 최소 1명 승인 후 머지
- PR 설명에 변경 내용, 변경 이유, 확인 방법을 적을 것
- 테이블 구조 변경은 migration, docs/database.md, apps/web 타입, apps/worker 코드를 같은 PR에 담을 것
- CLAUDE.md와 docs/ 수정은 팀 합의 후 PR로만 반영
