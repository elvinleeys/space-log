# Git 규칙

## 브랜치 구조
| 브랜치 | 용도 | 직접 커밋·푸시 | 삭제 |
|---|---|---|---|
| main | 배포 브랜치. develop(배포)과 hotfix(긴급 수정)의 PR만 받는다 | 금지 | 금지 |
| develop | 개발 통합 브랜치이자 GitHub 기본 브랜치. 작업 브랜치의 PR이 모이는 곳 | 금지 | 금지 |
| 작업 브랜치 | 기능·수정 단위 개인 작업. develop에서 만든다 | 허용 | PR 머지 후 삭제 |
| hotfix 브랜치 | 배포된 main의 긴급 수정. main에서 만든다 | 허용 | PR 머지 후 삭제 |

- main, develop은 GitHub ruleset으로 삭제·강제 푸시가 막혀 있고 PR로만 머지된다

## 작업 브랜치
- 작업은 항상 최신 develop에서 새 작업 브랜치를 만들어 진행한다
- 브랜치 이름: {접두어}/{유형}/{기능명}  예) minji/feat/pdf-upload
  - 유형은 커밋 접두어와 동일: feat / fix / chore / docs / refactor / test (긴급 수정만 hotfix, 커밋 접두어는 fix)
  - 기능명은 영어 소문자 + 하이픈(kebab-case)
  - 접두어: CLAUDE.local.md의 "브랜치 접두어" 값을 사용
  - 값이 없으면 git config user.name을 소문자로 바꾸고 공백을 하이픈으로 바꿔 사용
  - 접두어를 알 수 없으면 브랜치를 만들기 전에 사용자에게 물어볼 것
- PR이 머지되면 작업 브랜치는 GitHub에서 자동 삭제된다. 로컬 브랜치도 함께 정리한다
- main, develop은 어떤 경우에도 삭제하지 않는다

## 배포 (develop → main)
- develop → main으로 PR 생성, 제목: `release: YYYY-MM-DD`
- 머지 방식은 merge commit만 사용 (squash·rebase 금지: 두 브랜치 기록이 어긋남). main ruleset이 merge commit만 허용한다
- develop은 기본 브랜치이고 ruleset으로 보호되어 머지 후에도 삭제되지 않는다

## 긴급 수정 (hotfix)
- 배포된 main에 바로 고쳐야 할 문제가 있을 때만 쓴다. 일반 수정은 develop으로
- 최신 main에서 `{접두어}/hotfix/{기능명}` 브랜치를 만든다
- hotfix → main으로 PR, merge commit으로 머지
- 머지되면 hotfix 브랜치는 자동 삭제되므로, 이어서 main → develop으로 PR을 올려 develop에도 반영한다 (merge commit)
- main은 기본 브랜치가 아니라 `Closes #번호`가 동작하지 않는다. 관련 이슈는 main → develop PR 설명에 `Closes #번호`를 적는다

## 커밋
- 커밋 메시지: 유형 접두어 + 한국어 설명  예) feat: PDF 업로드 후 텍스트 추출 추가
- 커밋 전 npm run lint, npm run test 통과 확인

## PR
- 작업 브랜치 → develop으로 PR 생성. 리뷰 승인 없이 팀원 누구나 머지할 수 있다 (리뷰가 필요하면 PR에서 요청)
- PR 설명에 변경 내용, 변경 이유, 확인 방법을 적을 것 (양식: .github/pull_request_template.md)
- 관련 이슈는 PR 설명에 `Closes #번호`로 연결할 것. 기본 브랜치(develop)에 머지되면 이슈가 닫히고 보드 Done 칸으로 이동한다
  - 이슈 번호는 plan 승인 시 hook이 알려 준 번호, 모르면 `gh issue list --assignee @me`로 확인
  - 같은 작업으로 이슈가 여러 개 생겼으면 모두 `Closes`로 적거나, 중복 이슈는 닫는다
  - `gh pr create --body`로 만들면 템플릿이 적용되지 않으니 위 항목을 직접 넣을 것
- 테이블 구조 변경은 migration, docs/database.md, apps/web 타입, apps/worker 코드를 같은 PR에 담을 것
- CLAUDE.md와 docs/ 수정은 팀 합의 후 PR로만 반영
