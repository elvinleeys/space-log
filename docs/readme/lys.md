## 2026-11-27

- 기록 생성 API(POST /api/records): 로그인한 사용자가 메모·하이라이트·URL·영상·파일·캡처 기록을 저장하고, 파일은 서명 업로드 주소로 Storage에 올린다. 로컬 Supabase 기본 테이블(app_user·record_group·information_record, RLS, 가입 시 기본 그룹) 포함 (#43)
- 기록 1개에 파일 최대 10개(파일당 10MB, 합계 50MB) 저장, 화면 파일 이름 '제목1, 제목2…' 규칙, 10MB 넘는 jpg·png를 올리기 전에 줄이는 함수 (#45)
