---
name: daily
description: 하루 마무리 기록을 한 번에 남긴다. /readme(완료한 기능), /log(작업·문제 해결), /handoff(인수인계), /prompt(보낸 prompt)를 순서대로 모두 실행한다. "/daily", "오늘 기록 전부 남겨줘", "하루 마무리 기록해줘" 같은 요청에 사용.
---

# 하루 마무리 기록 (4개 스킬 한 번에)

아래 4개 스킬을 순서대로 실행한다. 각 스킬의 규칙(본인 문서 찾기, 날짜 섹션, 중복 판단, 근거 없는 항목 금지)은 각 SKILL.md를 그대로 따른다.

| 순서 | 스킬 | 기록 위치 |
|---|---|---|
| 1 | `/readme` (`.claude/skills/readme/SKILL.md`) | docs/readme/<본인>.md |
| 2 | `/log` (`.claude/skills/log/SKILL.md`) | docs/위임로그/<본인>.md |
| 3 | `/handoff` (`.claude/skills/handoff/SKILL.md`) | docs/handoff/<본인>.md |
| 4 | `/prompt` (`.claude/skills/prompt/SKILL.md`) | docs/prompts/<본인>.md |

## 진행 방식

1. 공통 준비는 한 번만 한다
   - `git config user.name`, `git config user.email` 확인
   - `git fetch origin`
   - 오늘 커밋·변경·PR 조회 결과는 여러 스킬에서 다시 조회하지 말고 재사용한다
2. 각 스킬의 SKILL.md를 읽고 순서대로 실행한다
   - 본인 문서를 물어봐야 하면 한 번만 묻고, 나머지 스킬의 매핑 표에도 같은 사람으로 한 줄씩 추가한다
   - 한 스킬에서 기록할 내용이 없으면("찾지 못했어요") 그 스킬만 건너뛰고 다음으로 넘어간다. 중간에 멈추지 않는다
   - 각 스킬의 "직접 불러줄 내용이 있는지 묻기"는 개별로 묻지 말고 4단계에서 한 번에 묻는다
3. 실패한 스킬이 있어도 나머지는 계속 실행하고, 마지막에 실패 원인을 알린다

## 마무리

4개 결과를 한 번에 보여준다.

```
/readme  → docs/readme/lys.md      : 2줄 추가 (또는 "추가할 내용 없음")
/log     → docs/위임로그/lys.md     : ...
/handoff → docs/handoff/lys.md     : ...
/prompt  → docs/prompts/lys.md     : ...
```

이어서 각 문서에 추가된 내용을 그대로 보여준다. 기록할 내용이 없었던 스킬이 있으면 직접 불러줄 내용이 있는지 한 번만 묻는다.
커밋·푸시는 사용자가 요청할 때만 한다.
