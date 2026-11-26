---
name: readme
description: 오늘 구현을 완료한 기능(feat 커밋)을 docs/readme/의 본인 문서에 날짜별로 기록한다. "/readme", "구현 완료 기록해줘", "완료한 기능 정리해줘" 같은 요청에 사용.
---

# 구현 완료한 기능 기록

오늘 내가 만든 `feat:` 커밋을 기능 단위로 `docs/readme/<본인>.md`에 1줄씩 기록한다.

## 1. 본인 문서 찾기

`git config user.name`으로 파일을 고른다.

| git user.name | 문서 |
|---|---|
| elvinleeys | docs/readme/lys.md |
| HAN GaYeong | docs/readme/hgy.md |
| yanggangyiplus | docs/readme/hgy.md |
| shinseonyi | docs/readme/ssi.md |
| junhyunu | docs/readme/jhw.md |

표에 없으면 `docs/readme/`의 파일 목록을 보여주고 본인 문서를 물어본 뒤, 답을 받으면 이 표에 한 줄 추가한다.

## 2. 오늘 완료한 기능 모으기

먼저 `git fetch origin`으로 원격 브랜치 정보를 최신으로 맞춘다.

```
git log --all --no-merges --since=midnight --author="<git config user.email>" --grep="^feat" --format="%h %s"
```

- 오늘(로컬 날짜) 내가 작성한 `feat:` 접두어 커밋만 대상. `fix`·`docs`·`chore`·`refactor`·`test`는 기록하지 않는다.
- 같은 커밋이 여러 브랜치에 있어도 한 번만 센다.
- 커밋마다 연결된 PR을 찾는다: `gh pr list --state all --search <커밋 해시> --json number -q '.[0].number'`. 있으면 `(#번호)`를 붙이고, 없으면 생략한다.
- 같은 기능을 여러 커밋으로 나눠 했으면 1줄로 합친다. PR 번호는 모두 붙인다(예: `(#12, #14)`).

대상 커밋이 없으면 기록하지 말고 "오늘 완료한 feat 커밋을 찾지 못했어요"라고 알린다.

## 3. 문서에 쓰기

날짜별 섹션(`## YYYY-MM-DD`)으로 나누고 날짜 순서대로 문서 아래쪽에 쌓는다. 기존 내용은 수정·삭제하지 않는다.

```markdown
## YYYY-MM-DD

- <구현한 기능 한 줄> (#PR번호)
```

- 오늘 섹션이 없으면 문서 맨 아래에 새로 만들고, 있으면 그 섹션 맨 아래에 빠진 항목만 덧붙인다.
- 중복 판단: 오늘 섹션에 이미 같은 기능이 있으면 표현이 달라도 추가하지 않는다. 단, 그 항목에 PR 번호가 없고 이번에 PR을 찾았다면 해당 줄에 PR 번호만 덧붙인다.
- 중복 판단은 같은 날짜 안에서만 한다.
- 항목은 커밋 메시지를 그대로 옮기지 말고, 사용자가 쓸 수 있게 된 기능 중심으로 1줄로 쓴다(`feat:` 접두어 제외). 근거 없는 내용은 쓰지 않는다.

## 4. 마무리

추가한 내용을 사용자에게 그대로 보여준다. 커밋·푸시는 사용자가 요청할 때만 한다.
