---
name: handoff
description: 오늘 한 일·막힌 곳·다음 할 일을 docs/handoff/의 본인 문서에 날짜별로 정리한다. 다음 작업자(또는 내일의 나)에게 넘길 인수인계용. "/handoff", "인수인계 정리해줘", "오늘 한 일이랑 다음 할 일 정리해줘" 같은 요청에 사용.
---

# 인수인계 기록

오늘 한 일, 막힌 곳, 다음 할 일을 `docs/handoff/<본인>.md`에 항목당 1줄씩 기록한다.

## 1. 본인 문서 찾기

`git config user.name`으로 파일을 고른다.

| git user.name | 문서 |
|---|---|
| elvinleeys | docs/handoff/lys.md |
| HAN GaYeong | docs/handoff/hgy.md |
| yanggangyiplus | docs/handoff/hgy.md |
| shinseonyi | docs/handoff/ssi.md |
| junhyunu | docs/handoff/jhw.md |

표에 없으면 `docs/handoff/`의 파일 목록을 보여주고 본인 문서를 물어본 뒤, 답을 받으면 이 표에 한 줄 추가한다.

## 2. 내용 모으기

오늘 날짜(로컬 기준) 기준으로 모은다. 먼저 `git fetch origin`.

**오늘 한 일**
- `git log --all --no-merges --since=midnight --author="<git config user.email>" --format="%h %s"` : 오늘 커밋
- `git status --short`, `git diff --stat` : 아직 커밋하지 않은 작업 (끝에 `(커밋 전)` 표시)
- `gh pr list --author @me --state all --search "updated:>=<어제 날짜>" --json number,title,state,updatedAt` : 오늘 올리거나 머지된 PR. GitHub 검색 날짜는 UTC라 어제부터 검색한 뒤, `updatedAt`을 로컬 시간으로 바꿔 오늘인 것만 남긴다
- 현재 대화에서 구현·결정·해결한 내용

**막힌 곳**
- 현재 대화에서 해결하지 못한 오류, 결정을 기다리는 일, 다른 사람 응답을 기다리는 일
- 오늘 작업과 관련해 `docs/open-questions.md`나 명세의 `[확인 필요]`로 남은 항목

**다음 할 일**
- 막힌 곳을 풀기 위한 다음 행동
- 머지 대기 중인 내 PR: `gh pr list --author @me --state open --json number,title`
- 나에게 할당된 열린 이슈: `gh issue list --assignee @me --state open --json number,title`
- 담당 작업 목록(`CLAUDE.local.md`의 담당 → `docs/tasks/`)에서 오늘 작업 다음으로 이어지는 미완료(`- [ ]`) 항목

모은 내용이 하나도 없으면 기록하지 말고 "오늘 정리할 내용을 찾지 못했어요"라고 알린 뒤, 직접 불러줄 내용이 있는지 묻는다.

## 3. 문서에 쓰기

날짜별 섹션(`## YYYY-MM-DD`)으로 나누고 날짜 순서대로 문서 아래쪽에 쌓는다. 기존 내용은 수정·삭제하지 않는다.

```markdown
## YYYY-MM-DD

### 오늘 한 일
- <한 일 한 줄> (#PR번호)

### 막힌 곳
- <무엇이 왜 막혔는지> → <필요한 것: 결정·응답·자료 등>

### 다음 할 일
- <다음 행동 한 줄>
```

- 오늘 섹션이 없으면 문서 맨 아래에 새로 만들고, 있으면 각 소제목 아래에 빠진 항목만 덧붙인다.
- 중복 판단: 오늘 섹션에 표현이 달라도 같은 내용이 있으면 추가하지 않는다. 중복 판단은 같은 날짜 안에서만 한다.
- 오늘 섹션의 "막힌 곳" 항목이 오늘 안에 풀렸으면 새 줄을 쓰지 않고 해당 줄 끝에 ` → 해결: <방법>`만 덧붙인다 (기존 내용 수정의 유일한 예외).
- 항목 하나는 반드시 1줄. 다른 사람이 읽고 바로 이어받을 수 있게 파일·기능·PR 이름을 넣어 구체적으로 쓴다.
- 막힌 곳이 없으면 `- 없음`.
- 추측으로 항목을 만들지 않는다. 근거(커밋, 변경, PR, 이슈, 대화, 문서)가 있는 것만 쓴다.

## 4. 마무리

추가한 내용을 사용자에게 그대로 보여준다. 커밋·푸시는 사용자가 요청할 때만 한다.
