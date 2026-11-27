# 계획 승인하면 GitHub 이슈가 자동으로 만들어지는 기능 — 적용 방법

## 1. 이 기능이 하는 일

Claude Code에게 일을 맡길 때, 먼저 **계획(plan)** 을 세우고 승인하는 단계가 있어요.
계획을 **승인하는 순간** 아래 일이 자동으로 일어납니다.

```
① 계획 승인 (Claude Code 화면에서 "Yes" 선택)
        ↓
② GitHub에 이슈(할 일 카드)가 생김
   - 제목: 계획의 제목
   - 내용: 계획 전체
   - 담당자: 나
        ↓
③ GitHub 프로젝트 보드 "space-log project"의 [In progress] 칸에 카드가 들어감
        ↓
④ 그다음 Claude가 실제 작업을 시작
```

- 계획을 **거절하면** 이슈가 만들어지지 않아요.
- 이슈 만들기에 실패해도 작업은 멈추지 않고, 화면에 실패했다는 안내만 나와요.

> 쉽게 말해, "지금 무슨 일을 하고 있는지"가 팀 보드에 자동으로 올라가는 기능이에요.

---

## 2. 내가 준비할 것 (팀원 각자, 처음 한 번만)

### 2-1. GitHub 계정
GitHub 계정이 있어야 해요. 없으면 https://github.com 에서 가입하고, 계정 이름을 프로젝트 주인(elvinleeys)에게 알려 주세요.

### 2-2. 초대 수락
프로젝트 주인이 초대하면 GitHub 알림이나 이메일로 초대가 와요. **수락(Accept)** 을 눌러 주세요. (초대 방법은 아래 3번)

### 2-3. GitHub CLI(gh) 설치와 로그인
`gh`는 컴퓨터에서 GitHub를 다루는 프로그램이에요. 이 기능이 내 계정으로 이슈를 만들 때 사용해요.

**설치** — Windows에서 터미널(PowerShell)을 열고 입력:
```
winget install GitHub.cli
```
(Mac은 `brew install gh`) 설치 후 터미널을 껐다가 다시 켜 주세요.

**로그인** — 입력 후 안내대로 고르면 브라우저가 열리고, GitHub에 로그인하면 끝:
```
gh auth login
```
고르는 항목: `GitHub.com` → `HTTPS` → `Login with a web browser`

**프로젝트 보드 권한 추가** — 이 한 줄이 꼭 필요해요:
```
gh auth refresh -s project
```

**확인** — 아래를 입력했을 때 `project`라는 글자가 보이면 준비 완료:
```
gh auth status
```

### 2-4. 최신 코드 받기
이 기능이 들어간 코드를 받은 뒤, **Claude Code를 새로 켜야** 적용돼요. (켜 둔 Claude Code는 껐다가 다시 켜기)

---

## 3. 쓰기 권한 주는 방법 (프로젝트 주인 elvinleeys가 할 일)

팀원이 이슈를 만들고 보드에 카드를 넣으려면 **두 곳**에 초대해야 해요.

### 3-1. 저장소(space-log)에 초대 — 이슈를 만들 수 있게
1. https://github.com/elvinleeys/space-log 접속
2. 위쪽 메뉴 **Settings** 클릭
3. 왼쪽 메뉴 **Collaborators** 클릭 (비밀번호를 물으면 입력)
4. 초록색 **Add people** 버튼 → 팀원 GitHub 이름 검색 → 선택 → 초대
5. 팀원이 초대를 **수락**하면 완료

### 3-2. 프로젝트 보드(space-log project)에 초대 — 카드를 [In progress] 칸에 넣을 수 있게
1. https://github.com/users/elvinleeys/projects/5 접속
2. 오른쪽 위 **⋯ (점 세 개)** → **Settings** 클릭
3. 왼쪽 메뉴 **Manage access** 클릭
4. **Invite collaborators** 칸에 팀원 GitHub 이름 입력 → 선택
5. 권한(Role)을 **Write** 로 고르고 **Invite** 클릭

| 초대한 곳 | 빠지면 생기는 일 |
| --- | --- |
| 저장소 | 이슈가 아예 만들어지지 않음 |
| 프로젝트 보드 | 이슈는 만들어지지만 [In progress] 칸에 안 들어감 |

---

## 4. 잘 되는지 확인하는 방법

1. Claude Code에서 계획 모드로 아무 작업이나 요청 (Shift+Tab을 눌러 plan mode로 바꾸기)
2. Claude가 계획을 보여 주면 승인
3. 화면에 `[plan-issue] 이슈 #번호 생성, Project 'In progress' 칸에 추가` 문구가 보이면 성공
4. https://github.com/users/elvinleeys/projects/5 의 [In progress] 칸에 카드가 있는지 확인

---

## 5. 자주 생기는 문제

| 화면에 보이는 말 | 이유 | 해결 |
| --- | --- | --- |
| `이슈 생성 실패` + `gh` 를 찾을 수 없음 | gh가 설치되지 않음 | 2-3 설치 후 터미널·Claude Code 다시 켜기 |
| `이슈 생성 실패` + 로그인 관련 문구 | gh 로그인이 안 됨 | `gh auth login` |
| `이슈 생성 실패` + 권한 관련 문구 | 저장소에 초대되지 않음 | 3-1 초대 요청 후 수락 |
| `칸 이동 실패` + `project` 관련 문구 | gh에 보드 권한이 없음 | `gh auth refresh -s project` |
| `칸 이동 실패` + 권한/찾을 수 없음 | 보드에 초대되지 않았거나 Write가 아님 | 3-2 초대(Write) 요청 |
| 아무 문구도 안 나옴 | 최신 코드가 아니거나 Claude Code를 다시 안 켬 | 최신 코드 받고 Claude Code 다시 켜기 |

---

## 6. 알아 두면 좋은 점

- 계획을 **승인할 때마다** 이슈가 1개씩 생겨요. 같은 일을 다시 승인하면 이슈가 하나 더 생기니, 필요 없는 건 GitHub에서 닫아 주세요.
- 작업이 끝나 PR을 올릴 때 PR 설명에 `Closes #이슈번호`를 적으면, PR이 합쳐질 때 이슈도 자동으로 닫혀요. (Claude에게도 이렇게 하라고 알려 줘요)
- 기능을 끄고 싶으면 `.claude/settings.json`에서 `ExitPlanMode` 부분을 지우는 PR을 올리면 돼요. (팀 전체에 적용)
- 설정 위치(기술 담당자용): 기능 코드 `.claude/hooks/plan-issue.mjs`, 연결 설정 `.claude/settings.json`

---

## 7. 다른 팀원에게 이슈 맡기기 (`/issue`)

Claude Code에 `/issue 누구 할일`을 입력하면, 그 팀원이 담당자인 이슈를 만들어 보드에 올려요.

```
/issue ssi 그룹 삭제 화면 문구 정리
/issue hgy 업로드 실패 안내 추가 Ready
```

- 담당자는 `lys`(elvinleeys), `hgy`(yanggangyiplus), `ssi`(shinseonyi), `jhw`(junhyunu) 중에서 골라요. 이름으로 불러도 돼요.
- 칸 이름(Backlog, Ready, In progress 등)을 붙이면 그 칸에 넣고, 없으면 **Backlog** 칸에 넣어요.
- 담당자에게 알림이 가기 때문에, Claude가 발행 전에 제목과 내용을 보여 주고 확인을 받아요.
- 준비물과 권한은 위 2번·3번과 같아요.
