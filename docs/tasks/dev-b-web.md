# 개발자 B · 웹 (FastAPI 가공 서버 포함)
맡는 폴더: apps/web, apps/worker
읽을 것: apps/web/CLAUDE.md, apps/worker/CLAUDE.md, docs/spec/ 전체

## 1단계 · 수집 흐름 (먼저)
- [x] B1. Next.js + Tailwind CSS 세팅
- [ ] B2. Supabase 인증 구글 로그인, 첫 로그인 시 기본 그룹 생성, 데스크톱 로그인 콜백 이동 (데스크톱 A2와 맞물림)
- [ ] B3. 수집 API: 기록 생성·업로드 권한 발급·업로드 완료 알림·worker 가공 요청 전달 (X-Worker-Secret)
  - [x] 기록 생성 + 업로드 권한 발급 (POST /api/records)
  - [ ] 업로드 완료 알림
- [ ] B4. FastAPI worker: Pydantic 요청 모델 정의 → 요청 수신 → 형식별 추출 (PDF·HTML·txt·md·csv, 이미지 OCR, URL, 영상 링크) → 요약 → 요약본·원문 조각 벡터 Qdrant 저장 → 상태 갱신 → 주기적 재처리 + pytest
- [ ] B5. AI 그룹 추천과 새 그룹 이름 추천 [확인 필요: 처리 위치와 시점]

## 2단계 · 찾기
- [ ] B6. 메인 우주: 사이드바, 그룹 바로가기, 기간 필터, 3D 행성, 처리 중 표시 [확인 필요: 3D 라이브러리]
- [ ] B7. 행성 상세 패널 + 그룹 관리 (이름 변경, 삭제 흐름: 빈 그룹 바로 삭제, 기록 있으면 옮기기/모두 삭제 선택)
- [ ] B8. 기록 넣기 창 (웹 수집, packages/shared 수집 함수 사용)
- [ ] B9. 기록 목록·검색
- [ ] B10. 기록 상세
- [ ] B11. 물어보기 챗봇 (Next.js 서버, user_id 필터, 근거 기록 반환)
- [ ] B12. 설정, MCP 연결

## 3단계 · P1 (설문 결과로 근거 판단)
- [ ] B13. 연결 추천·수락, 별자리 선
- [ ] B14. 블랙홀 리마인드
- [ ] B15. 재발견 메모 (UI 확정 후)

## 시작 전에 정할 것
- 3D 라이브러리, 시안 A·B 최종 선택, 검색 범위, Storage 파일 보여 주는 방식, 기록 삭제 범위, 컬렉션 구성 (docs/open-questions.md)
