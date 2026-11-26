---
name: prompt
description: 오늘 이 프로젝트에서 Claude Code에 보낸 내 prompt 원문을 docs/prompts/의 본인 문서에 날짜별로 기록한다. "/prompt", "오늘 프롬프트 기록해줘", "보낸 prompt 정리해줘" 같은 요청에 사용.
---

# 오늘 보낸 prompt 기록

## 1. 본인 문서 찾기

`git config user.name`으로 파일을 고른다.

| git user.name | 문서 |
|---|---|
| elvinleeys | docs/prompts/lys.md |
| HAN GaYeong | docs/prompts/hgy.md |
| shinseonyi | docs/prompts/ssi.md |
| junhyunu | docs/prompts/jhw.md |

표에 없으면 `docs/prompts/`의 파일 목록을 보여주고 본인 문서를 물어본 뒤, 답을 받으면 이 표에 한 줄 추가한다.

## 2. 기록 실행

프로젝트 루트에서 실행한다.

```
node .claude/skills/prompt/record.mjs <본인 문서 경로>
```

스크립트가 하는 일:
- 이 프로젝트의 오늘(로컬 날짜) 모든 Claude Code 세션 기록(`~/.claude/projects/<프로젝트>/*.jsonl`)에서 내가 보낸 prompt만 원문 그대로 모은다.
- 제외: `/prompt` 명령 자체, 5글자 미만 짧은 응답(예: "응", "ㅇㅇ", "계속"), 시스템 메시지, 하위 에이전트 대화.
- `## YYYY-MM-DD` 오늘 섹션이 없으면 문서 맨 아래에 만들고, 있으면 그 아래(문서 맨 아래)에 덧붙인다.
- 오늘 섹션에 이미 같은 원문이 있으면 쓰지 않는다. 중복 판단은 같은 날짜 안에서만 한다.
- 각 prompt는 인용 블록(`> `)으로, prompt 사이는 빈 줄로 구분한다. 기존 내용은 수정·삭제하지 않는다.

문서를 손으로 고칠 때도 이 형식(인용 블록 + 빈 줄 구분)을 유지해야 중복 판단이 맞게 동작한다.

## 3. 마무리

스크립트 출력(추가된 prompt)을 사용자에게 그대로 보여준다. 커밋·푸시는 사용자가 요청할 때만 한다.
