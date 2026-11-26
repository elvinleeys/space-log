# 역할
수집 전용 Electron 앱. 바탕화면의 우주 비행사 캐릭터에 끌어다 놓거나 메뉴로 기록을 넣는다.
열람·검색·챗봇은 만들지 않는다 (웹 담당).

# 명세
- 화면: docs/spec/screens/01-desktop-collector.md, docs/spec/screens/02-login.md
- 기능: docs/spec/features/f01-login.md, f02-save-record.md, f03-group-recommend.md
- 작업 목록: docs/tasks/dev-a-desktop.md

# 프로세스 구분
- main: OS 연동. 항상 위에 뜨는 창, 화면 캡처, 파일 읽기, 로그인용 임시 서버
- preload: main과 renderer를 잇는 통로. renderer는 preload가 노출한 API만 사용
- renderer: 화면. Node.js API를 직접 쓰지 말 것
- IPC 채널 이름은 한 파일에서만 정의 (파일 위치는 빌드 도구를 정한 뒤 결정)

# 로그인 (로컬 주소로 돌려받기 + PKCE)
1. 앱이 127.0.0.1의 임의 포트에 임시 서버를 연다
2. 브라우저로 웹 로그인 페이지를 연다
3. 웹에서 로그인 성공 → http://127.0.0.1:포트/callback?code=일회용코드 로 이동
4. 앱이 코드와 PKCE 검증값을 서버에 보내 토큰으로 바꾸고, 임시 서버를 닫는다
- PKCE 검증값(verifier)은 앱 메모리에만 두고 로그에 남기지 말 것
- 임시 서버는 127.0.0.1에만 열 것 (0.0.0.0 금지)

# 수집 규칙
- 저장은 packages/shared의 수집 함수만 사용 (업로드 코드를 앱에 따로 쓰지 말 것)
- 끌어다 놓기
  - 브라우저에서 선택한 글: 하이라이트 기록. 문장 그대로 + 페이지 주소
  - 브라우저 주소: URL 기록 (유튜브 등은 영상 링크)
  - 웹페이지 이미지, 바탕화면 파일: 파일 기록
- 지원 형식(csv, txt, md, jpeg, jpg, png, svg, HTML, PDF)과 10MB 제한은 올리기 전에 앱에서 먼저 검사
- 그룹은 AI 추천 그룹이 기본값

# 미정 — 구현 전에 사용자에게 선택지를 주고 물어볼 것
- Electron 빌드 도구 (Electron Forge, electron-vite 등)
- 놓으면 바로 저장할지, 그룹을 고르는 작은 저장 창을 띄울지
- 캐릭터 메뉴 항목 (캡처, 메모 외), 저장 결과 표시 방식
- 포트와 PKCE 값을 웹 로그인 페이지에 넘기는 방식, 토큰 교환을 맡는 서버
- 토큰 보관 위치
- 브라우저 로그인을 끝내지 않고 닫았을 때 임시 서버 처리
- 지원하지 않는 형식이나 10MB를 넘는 파일을 놓았을 때 안내 방식
