# Spacelog 로고 (G1 확정)

굵은 세리프 소문자 `spacelog`에 파란 마침표(#0066cc)를 찍은 로고입니다. 결정 기록: [docs/decisions.md](../../decisions.md) 2026-11-28.

- 서비스가 다크 모드만 쓰므로 **로고는 흰색**이고 어두운 바탕에만 씁니다.
- 강조색은 마침표의 **#0066cc** 하나입니다. 로고 색을 바꾸거나, 늘리거나, 기울이지 않습니다.
- SVG의 글자는 도형(윤곽선)으로 바꿔 두어 글꼴을 설치하지 않아도 됩니다. 원래 글꼴은 Fraunces(OFL, 무료·상업 사용 가능)입니다.

## 어디에 어떤 파일을 쓰나

### 공통 원본

| 파일 | 크기 | 쓰는 곳 |
| --- | --- | --- |
| `spacelog-logo.svg` | 321×94 (벡터) | 가로 로고. 웹 목록 창 위, 로그인 화면 등 |
| `spacelog-logo@4x.png` | 1286×376 | SVG를 못 쓰는 곳(문서, 발표 자료) |
| `spacelog-symbol.svg` | 256×256 (벡터) | 아이콘 원본 `s.` (투명 배경) |
| `spacelog-symbol-512.png` | 512×512 | 아이콘 PNG (투명 배경) |
| `spacelog-favicon.svg` | 32×32 (벡터) | 32px 이하 작은 자리용 단순 버전. 마침표를 키워 작은 크기에서도 보임 |

### 웹 (`apps/web`)

| 파일 | 크기 | 쓰는 곳 |
| --- | --- | --- |
| `web/favicon.ico` | 16·32·48 | 브라우저 탭. 검정 둥근 사각형 바탕이라 밝은 탭에서도 보임 |
| `web/apple-touch-icon.png` | 180×180 | 아이폰 홈 화면에 추가할 때. 검정 바탕(아이폰이 모서리를 둥글게 자름) |
| `web/icon-192.png`, `web/icon-512.png` | 192, 512 | 웹앱 설치 아이콘(manifest). 검정 바탕, 가장자리가 잘려도 되게 여백을 둠 |
| `web/og-image.png` | 1200×630 | 카톡·슬랙 등에 링크를 붙였을 때 뜨는 미리보기 그림 |

Next.js(App Router)는 `src/app/` 아래에 `favicon.ico`, `apple-icon.png`, `icon.png`, `opengraph-image.png`를 두면 자동으로 연결합니다.

### 데스크톱 (`apps/desktop`)

| 파일 | 크기 | 쓰는 곳 |
| --- | --- | --- |
| `desktop/icon.ico` | 16~256 | Windows 앱 아이콘. 작은 크기(16~48)는 favicon 버전으로 들어 있음 |
| `desktop/icon.icns` | 16~1024 | macOS 앱 아이콘. 애플 아이콘 격자(1024 안에 824 둥근 사각형)를 따름 |
| `desktop/icon-512.png` | 512×512 | Linux 앱 아이콘, 창 아이콘 |
| `desktop/tray-white-16.png`, `-32.png` | 16, 32 | Windows 작업 표시줄 트레이(어두운 작업 표시줄) |
| `desktop/trayTemplate.png`, `@2x.png` | 16, 32 | macOS 메뉴 막대. 검정+투명이라 시스템이 밝기에 맞춰 색을 입힘. 밝은 작업 표시줄에도 이것을 씀 |

설치 파일(.exe, .dmg)의 아이콘 연결은 빌드 도구가 정해진 뒤(docs/tasks/dev-a-desktop.md A1) 위 `icon.*` 파일을 지정하면 됩니다.

### 외부 서비스

| 파일 | 크기 | 쓰는 곳 |
| --- | --- | --- |
| `google-oauth-120.png` | 120×120 | 구글 로그인 동의 화면(Google Cloud Console의 앱 로고). 흰 바탕에 뜨므로 검정 바탕을 채움 |

## 코드에서 쓰기

- **화면 안의 로고**(목록 창, 로그인 화면 등): 두 앱에서 함께 쓰는 `<Logo />` 컴포넌트를 `packages/ui`에 만들어 씁니다(CLAUDE.md: 두 앱에서 쓰는 컴포넌트는 packages/ui에 두고 앱 폴더에 복사 금지).
- **아이콘 파일**(파비콘, 앱 아이콘, 트레이, OG 이미지): 각 앱의 프레임워크가 정한 위치로 필요한 파일만 복사해 씁니다. 원본은 이 폴더에 둡니다.
