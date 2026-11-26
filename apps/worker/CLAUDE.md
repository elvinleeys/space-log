# 역할
Flask 가공 서버. 업로드된 기록에서 글자를 뽑아 요약하고 임베딩해 저장한다.
담당: 웹 담당 개발자 (docs/tasks/dev-b-web.md)

# 명세
- docs/spec/features/f04-process-index.md
- 데이터 구조: docs/database.md

# 명령어
- python -m venv .venv 후 가상환경 활성화
- pip install -r requirements.txt
- flask --app app run --debug: 개발 서버
- pytest: 테스트
- 새 패키지는 requirements.txt에 버전과 함께 추가

# 처리 흐름
1. apps/web에서 가공 요청 수신. X-Worker-Secret 헤더가 다르면 거부
2. 즉시 응답하고 백그라운드에서 처리
3. Supabase에서 기록 조회, status를 processing으로 변경
4. 형식별 글자 추출
   - PDF, HTML, txt, md, csv: 글자 추출
   - jpeg, jpg, png, svg: OCR
   - URL: 원문을 가져와 글자 추출 (원문 글은 저장하지 않음)
   - 영상 링크(유튜브 등): 자막 또는 음성을 글로 변환
   - 하이라이트: 요약하지 않고 선택 문장 그대로
5. AI API로 요약본 생성
6. 요약본 벡터 1개 + 원문 조각 벡터 여러 개를 만들어 Qdrant에 저장
7. Supabase에 요약본, embedding_model 저장
8. status를 done으로. 실패 시 failed + error_message 저장
9. done이고 source_url이 있는 파일 기록이면 Storage 원본 삭제

# Qdrant 규칙
- 기록 1개에서 벡터가 여러 개 나온다. 벡터 식별값을 기록 식별값과 같게 쓰지 말 것
- payload 필수: user_id, record_id, vector_kind(summary 또는 chunk). chunk는 chunk_index도 저장
- 같은 기록을 다시 처리하면 그 record_id의 기존 벡터를 지운 뒤 새로 저장 (조각 수가 바뀔 수 있음)
- 원문 조각 글은 payload에 넣지 않는다 (URL 원문 미저장 결정)
- Supabase 저장이 먼저, Qdrant 저장은 그 다음. Qdrant에만 있는 데이터를 만들지 말 것

# 재처리
- 주기적으로 오래 queued 또는 processing인 기록을 찾아 다시 처리
- 같은 기록을 여러 번 처리해도 결과가 같아야 한다 (멱등성)

# 파일 규칙
- 원본 파일: 출처 링크(source_url)가 있는 파일은 가공 성공(done) 후 Storage 원본을 지우고 출처 링크로 본다. 출처 링크가 없는 파일(내 컴퓨터에서 올린 파일, 화면 캡처)은 원본을 유지한다. 가공에 실패한 파일은 지우지 않는다
- 원본 삭제는 Supabase에 done을 저장한 뒤 마지막 단계에서 한다 [확인 필요: 삭제 후 file_path를 비울지, 삭제 시각을 따로 남길지]
- 타입별 추출 로직은 processors/ 폴더에 함수로 분리. Flask 라우트에 직접 작성 금지
- OpenAI·Supabase·Qdrant 키와 X-Worker-Secret은 환경변수로만 읽기

# 테스트
- processors/ 함수는 pytest로 테스트 (샘플 파일은 tests/fixtures/)

# 미정 — 구현 전에 사용자에게 선택지를 주고 물어볼 것
- 재시도 방식, 원문을 가져올 수 없는 링크(인스타그램, 유료 기사) 처리
- 자막이 없는 영상의 음성 변환 방법, 영상 길이 제한
- 요약본 벡터와 원문 조각 벡터를 둘 컬렉션 구성 (하나 또는 둘)
- 요약본이 없는 하이라이트·메모의 벡터 재료
- 메모도 요약할지
- 임베딩 모델 이름을 웹과 함께 쓰는 설정 위치
