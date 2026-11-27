---
name: issue
description: 팀원 한 명을 담당자로 지정해 GitHub 이슈를 만들고 "space-log project" 보드에 올린다. "/issue", "OO에게 이슈 만들어줘", "이 작업 OO한테 할당해줘" 같은 요청에 사용.
---

# 팀원에게 이슈 발행

사용 예: `/issue ssi 그룹 삭제 화면 문구 정리`, `/issue 가영 업로드 실패 안내 추가 Ready`

## 1. 담당자 고르기

요청에서 담당자를 찾는다. 아래 어느 칸의 값으로 불러도 같은 사람이다.

| 문서 | git user.name | GitHub 계정 (assignee) |
|---|---|---|
| lys | elvinleeys | elvinleeys |
| hgy | HAN GaYeong | yanggangyiplus |
| ssi | shinseonyi | shinseonyi |
| jhw | junhyunu | junhyunu |

- 담당자가 없거나 여러 명에 해당하면 이 표를 보여 주고 한 명을 물어본다.
- 표에 없는 사람이면 `gh api repos/elvinleeys/space-log/assignees -q '.[].login'`으로 지정 가능한 계정을 확인한다. 있으면 GitHub 계정을 물어 표에 한 줄 추가하고, 없으면 저장소 초대가 먼저 필요하다고 알린다 (`issue_적용방법.md` 3번).

## 2. 이슈 내용 만들기

- 제목: 할 일을 한 줄로. 유형이 분명하면 앞에 붙인다 (예: `feat: PDF 업로드 용량 제한`)
- 본문: 요청과 대화에서 근거가 있는 내용만 쓴다. 모르는 칸은 지어내지 말고 빼거나 사용자에게 묻는다.

```markdown
## 배경
<왜 필요한가>

## 할 일
- [ ] <구체적인 작업>

## 완료 기준
- <무엇이 되면 끝인가>

## 참고
<관련 명세(docs/spec/...), 이슈, PR>
```

- 보드 칸: 요청에 칸 이름(Backlog, Ready, In progress, In review, Done)이 있으면 그 칸, 없으면 **Backlog**.

## 3. 확인받고 발행

이슈를 만들면 담당자에게 알림이 가므로, 발행 전에 담당자·제목·칸·본문을 보여 주고 확인을 받는다. 확인을 받은 뒤 순서대로 실행한다.

```bash
# 1) 이슈 생성 (본문은 표준입력으로)
gh issue create --title "<제목>" --assignee <GitHub 계정> --body-file -

# 2) 보드에 추가 후 칸 지정
gh project item-add 5 --owner elvinleeys --url <이슈 URL> --format json --jq .id      # → item id
gh project view 5 --owner elvinleeys --format json --jq .id                            # → project id
gh project field-list 5 --owner elvinleeys --format json --jq '.fields[] | select(.name=="Status")'  # → field id, 칸 option id
gh project item-edit --id <item id> --project-id <project id> --field-id <field id> --single-select-option-id <칸 option id>
```

- 칸 id는 이름으로 찾는다 (하드코딩하지 않는다).
- 이슈는 만들어졌는데 보드 추가가 실패하면, 이슈 URL과 실패 이유를 알리고 `gh auth refresh -s project` 또는 보드 Write 권한(`issue_적용방법.md` 3-2)을 안내한다. 이슈를 다시 만들지 않는다.

## 4. 마무리

`#번호 제목 → 담당자 (칸)`과 이슈 URL을 보여 준다.
