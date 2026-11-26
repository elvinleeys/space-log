# 역할
데스크톱 앱과 웹이 함께 쓰는 TypeScript 코드. 두 담당자 모두에게 영향을 주는 약속이다.
- src/types: 기록·그룹·처리 상태 등 공통 타입
- src/collect: 수집 함수 (기록 생성 요청 → 파일 업로드 → 업로드 완료 알림)
- src/storage: 파일 저장 인터페이스 (현재 Supabase Storage)
- src/vector: 검색 결과 타입과 검색 함수 인터페이스만 둔다. Qdrant 키를 쓰는 실제 구현은 apps/web 서버 코드에 둔다

# 규칙
- Supabase SDK는 이 패키지 안에서만 import. Qdrant SDK는 여기서 import하지 말 것
- 비밀키를 쓰는 코드는 두지 말 것. 데스크톱 앱과 브라우저에서도 import되기 때문
- 타입은 docs/database.md의 필드 이름과 맞출 것
- 수정하면 Vitest 테스트를 함께 추가·수정
- 이 패키지를 바꾸는 PR은 데스크톱 담당과 웹 담당이 모두 확인
