# 명세 목차

기준 문서: Spacelog PRD (2026-11-25), 화면정의서 [screen-definition-v1.md](../screen-definition/screen-definition-v1.md) (프로토타입 v2 `docs/design/spacelog-prototype-v2.html` 기준). 웹 화면이 다르면 화면정의서를 따른다.
`[확인 필요]`는 아직 정하지 않은 내용이다. 구현 전에 사용자에게 선택지를 주고 물어본다.

- 요구사항: [requirements.md](requirements.md)

## 화면

| 파일 | 화면 | 앱 | 담당 | 우선순위 | 요구사항 |
| --- | --- | --- | --- | --- | --- |
| [01](screens/01-desktop-collector.md) | 수집 캐릭터 | 데스크톱 | 데스크톱 | P0 | R2, R3 |
| [02](screens/02-login.md) | 로그인 | 데스크톱, 웹 | 둘 다 | P0 | R1 |
| [03](screens/03-space.md) | 홈 · List / Space | 웹 | 웹 | P0 | R3, R5, R9, R10 |
| [04](screens/04-planet-panel.md) | 그룹 창 (Space) · 그룹 관리 | 웹 | 웹 | P0 | R3, R5 |
| [05](screens/05-add-record.md) | 기록 넣기 | 웹 | 웹 | P0 | R2, R3 |
| [06](screens/06-record-list.md) | 기록 목록 (List) · 일괄 동작 | 웹 | 웹 | P0 | R5 |
| [07](screens/07-record-detail.md) | 기록 상세 및 재발견 메모 | 웹 | 웹 | P0 | R4, R5, R8 |
| [08](screens/08-chat.md) | 물어보기 | 웹 | 웹 | P0 | R6 |
| [09](screens/09-link.md) | 연결 · 모아보기 (보류) | 웹 | 웹 | P1 | R9 |
| [10](screens/10-blackhole.md) | 블랙홀 (숨김) | 웹 | 웹 | P1 | R8, R10 |
| [11](screens/11-settings.md) | 설정 · 계정 | 웹 | 웹 | P0 | R7, R10 |

## 화면정의서에만 있는 기능

별도 명세 파일 없이 화면정의서를 따른다.

| 화면정의서 | 기능 | 관련 명세 |
| --- | --- | --- |
| [F-08](../screen-definition/screen-definition-v1.md#f-08-분류-안-된-기록-카드) | 빠른 분류 카드 ('분류 안 된 기록') | 04, 06 |
| [F-15](../screen-definition/screen-definition-v1.md#f-15-함께-볼-만한-기록--돌아가기) | 돌아가기 띠 (함께 볼 만한 기록에서 넘어왔을 때) | 07 |
| [F-21](../screen-definition/screen-definition-v1.md#f-21-긴-답-크게-보기) | 긴 답 크게 보기 | 08 |
| [F-22](../screen-definition/screen-definition-v1.md#f-22-자주-묻는-질문) | 자주 묻는 질문 | 08 |
| [F-23](../screen-definition/screen-definition-v1.md#f-23-챗봇-설정) | 챗봇 설정 (챗봇이 읽지 않을 그룹) | 08 |
| [F-25](../screen-definition/screen-definition-v1.md#f-25-모바일-형식) | 모바일 형식 (상단바, 사이드바) | 03 |

## 기능

| 파일 | 기능 | 담당 | 요구사항 |
| --- | --- | --- | --- |
| [F1](features/f01-login.md) | 로그인 (이메일, Google) | 둘 다 | R1 |
| [F2](features/f02-save-record.md) | 기록 저장 | 둘 다 | R2 |
| [F3](features/f03-group-recommend.md) | AI 그룹 추천 | 웹 | R3 |
| [F4](features/f04-process-index.md) | 기록 가공·색인 | 웹 (FastAPI) | R4 |
| [F5](features/f05-group-manage.md) | 그룹 관리 | 웹 | R3 |
| [F6](features/f06-search.md) | 기록 찾기 | 웹 | R5 |
| [F7](features/f07-record-view.md) | 기록 조회 | 웹 | R5 |
| [F8](features/f08-rediscovery-note.md) | 재발견 메모 저장 (P1) | 웹 | R8 |
| [F9](features/f09-chat.md) | AI 챗봇 답변 | 웹 | R6 |
| [F10](features/f10-mcp.md) | MCP 찾기·저장 | 웹 | R7 |
| [F11](features/f11-link.md) | 연결 추천·수락 (P1) | 웹 | R9 |
| [F12](features/f12-remind.md) | 리마인드 (P1) | 웹 | R10 |
