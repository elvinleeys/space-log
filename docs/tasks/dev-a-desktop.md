# 개발자 A · 데스크톱 앱
맡는 폴더: apps/desktop (+ packages/shared/src/collect 주 담당, 제안)
읽을 것: apps/desktop/CLAUDE.md, docs/spec/screens/01-desktop-collector.md, 02-login.md, docs/spec/features/f01·f02·f03

## 작업 목록
- [ ] A1. Electron 프로젝트 세팅 — 빌드 도구를 먼저 정한다 [확인 필요]
- [ ] A2. 로그인: 127.0.0.1 임시 서버 → 브라우저로 웹 로그인 → 콜백으로 일회용 코드 수신 → PKCE로 토큰 교환 → 임시 서버 종료
  - 웹 담당 B2(로그인 페이지, 콜백 이동)와 맞물림. 넘기는 값의 형식은 둘이 먼저 합의
- [ ] A3. 항상 위에 떠 있는 우주 비행사 캐릭터 창
- [ ] A4. 끌어다 놓기 수집: 선택한 글(하이라이트), 브라우저 주소(URL·영상 링크), 이미지, 파일
- [ ] A5. 올리기 전 검사: 지원 형식(csv, txt, md, jpeg, jpg, png, svg, HTML, PDF), 10MB
- [ ] A6. 캐릭터 메뉴: 화면 캡처, 메모 저장
- [ ] A7. packages/shared/src/collect 수집 함수 (기록 생성 → 업로드 → 완료 알림) + Vitest 테스트
- [ ] A8. 저장 결과 표시 [확인 필요: 방식]

## 다른 담당과 맞물리는 곳
- 웹 B3의 수집 API가 있어야 실제 저장이 된다. API 완성 전에는 함께 정한 요청·응답 타입으로 개발한다
- AI 그룹 추천(F3) 결과를 받는 방식은 B5와 함께 정한다

## 시작 전에 정할 것
- 빌드 도구, 놓으면 바로 저장 vs 저장 창, 메뉴 항목, 토큰 보관 위치 (docs/open-questions.md)
