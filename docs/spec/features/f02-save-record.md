# F2. 기록 저장
담당: 웹(API, 기록 넣기 창) + 데스크톱(수집 캐릭터). 수집 함수는 packages/shared · 요구사항: R2

- **입력**: 정보 (메모 글, 하이라이트 문장, URL, 영상 링크, 파일, 캡처), 제목 (선택), 원래 맥락 (선택), 그룹 (선택), 수집 경로 (desktop, web, mcp). 지원 파일 형식은 csv, txt, md, jpeg, jpg, png, svg, HTML, PDF이고, 파일 1개는 10MB까지
- **처리**: 기록을 uploading 상태로 만든다. 파일은 Supabase Storage에 올리고 경로를 기록에 남긴다. 업로드 완료 알림을 받으면 queued로 바꾸고, 웹 서버가 가공 서버(FastAPI)에 가공을 요청한다
- **출력**: 저장된 정보 기록 (처리 중)
- **예외**: [확인 필요: 지원하지 않는 형식이나 10MB를 넘는 파일을 넣었을 때의 안내 방식] [확인 필요: 업로드·저장 실패 처리]

화면: screens/01-desktop-collector.md, screens/05-add-record.md
