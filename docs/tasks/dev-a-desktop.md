# 개발자 A · 데스크톱 앱
맡는 폴더: apps/desktop (+ packages/shared/src/collect 주 담당, 제안)
읽을 것: apps/desktop/CLAUDE.md, docs/spec/screens/01-desktop-collector.md, 02-login.md, docs/spec/features/f01·f02·f03

## 작업 목록
- [x] A1. Electron 프로젝트 세팅 — 개발·빌드는 electron-vite, 설치 파일은 electron-builder (`npm run dist -w apps/desktop`)
- [ ] A2. 로그인: 127.0.0.1 임시 서버 → 브라우저로 웹 로그인 → 콜백으로 일회용 코드 수신 → PKCE로 토큰 교환 → 임시 서버 종료
  - 웹 담당 B2(로그인 페이지, 콜백 이동)와 맞물림. 넘기는 값의 형식은 둘이 먼저 합의
  - 앱 쪽 흐름은 가짜 웹 로그인(`src/main/auth/fake-web.ts`)으로 구현됨. B2가 생기면 그 파일만 실제 구현으로 바꾼다
- [x] A3. 항상 위에 떠 있는 우주 비행사 캐릭터 창
- [x] A4. 끌어다 놓기 수집: 브라우저 주소(URL·영상 링크), 이미지, 파일
- [x] A5. 올리기 전 검사: 지원 형식(csv, txt, md, jpeg, jpg, png, svg, HTML, PDF), 10MB
- [x] A6. 캐릭터 메뉴: 클립보드 붙여넣기, 메모, 화면 캡처, 파일선택, 웹 열기, 앱 종료
- [x] A7. packages/shared/src/collect 수집 함수 (기록 생성 → 업로드 → 완료 알림) + Vitest 테스트
  - `collectRecord`. 업로드 완료 알림 주소(`POST /api/records/{id}/uploaded`)는 잠정 약속이라 B3에서 맞춘다. 앱은 아직 가짜 응답(`shared/api/mock.ts`)을 쓴다
- [x] A8. 저장 결과 표시: 캐릭터 옆 말풍선 (올리는 중, 업로드 완료, 가공 완료, 형식·크기 오류, 저장 실패, 가공 실패)
- [x] A9. 저장 창: 그룹 선택 ('분류 안 된 기록' 기본, 다른 그룹 고르기, 새 그룹 만들기. AI 추천 없음), 출처 주소 선택 입력
- [x] A10. 트레이 메뉴(로그인, 웹 열기, 컴퓨터를 켜면 자동 실행, 앱 종료)와 앱·트레이 아이콘 (로고 G1)
- [ ] A11. 실제 서버 연결: 웹 로그인(B2)과 수집 API(B3)가 생기면 가짜 로그인·가짜 응답을 실제 구현으로 교체

## 다른 담당과 맞물리는 곳
- 웹 B3의 수집 API가 있어야 실제 저장이 된다. API 완성 전에는 함께 정한 요청·응답 타입으로 개발한다
- 저장 창은 웹 기록 넣기 창(B8)과 같은 그룹 목록 조회, 새 그룹 만들기를 쓴다. 웹 화면만이 아니라 앱에서도 부를 수 있는 API로 열려 있어야 한다 (웹 담당과 합의)
- 가공 완료·실패를 말풍선으로 알리려고 기록의 처리 상태를 3초마다 조회한다. 기록 하나의 상태를 돌려주는 API가 필요하다 (웹 담당과 합의)

## 시작 전에 정할 것
- 토큰 보관 위치 (docs/open-questions.md)
