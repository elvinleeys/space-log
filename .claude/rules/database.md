---
paths:
  - "supabase/migrations/**"
  - "apps/worker/**"
  - "packages/shared/src/types/**"
  - "packages/shared/src/vector/**"
  - "apps/web/app/api/**"
---
# 데이터 작업 규칙
- 작업 전 docs/database.md에서 관련 테이블, 처리 상태 값, Qdrant payload 형식을 확인할 것
- 테이블 구조를 바꾸면 migration, docs/database.md, apps/web 타입(packages/shared/src/types), apps/worker 코드를 같은 PR에서 함께 수정
- 처리 상태 값은 uploading, queued, processing, done, failed 다섯 개만 쓴다
- 정보 기록은 그룹 하나에만 속한다 (group_id 필수). 추천이 없으면 기본 그룹 '분류 안 된 기록'
- 재발견 메모 테이블은 UI가 정해지지 않아 잠정이다. 필드를 늘리기 전에 사용자에게 물어볼 것
- Qdrant payload 필수 값: user_id, record_id, vector_kind (summary, chunk). chunk는 chunk_index도
- Qdrant 벡터 식별값을 기록 식별값과 같게 쓰지 말 것 (기록 1개에 벡터 여러 개)
- Qdrant 검색에는 user_id 필터를 반드시 건다
- URL·영상 링크의 원문 글은 DB에도 Qdrant에도 저장하지 않는다
- 업로드 원본 파일은 Storage에서 지우지 않는다 (기록 삭제 범위는 미정)
