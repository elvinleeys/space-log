# 역할
FastAPI 가공 서버. 업로드된 기록에서 글자를 뽑아 요약하고 임베딩해 저장한다.
담당: 웹 담당 개발자 (docs/tasks/dev-b-web.md)

# 명세
- docs/spec/features/f04-process-index.md
- 데이터 구조: docs/database.md

# 명령어
- python -m venv .venv 후 가상환경 활성화
- pip install -r requirements.txt (fastapi, uvicorn 포함)
- uvicorn main:app --reload: 개발 서버 (앱 파일은 main.py, 앱 객체 이름은 app)
- 개발 서버 실행 중 /docs 에서 요청·응답 형식 확인
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
5. 원문 조각 벡터 여러 개를 만들어 Qdrant에 저장 (AI 정리글은 만들지 않음)
6. '분류 안 된 기록'이면 뽑은 글자·파일 이름·메모로 그룹을 추천해 suggested_group_id에 저장 [확인 필요: 처리 위치. 가공 서버에서 할지 웹 서버에서 할지 (docs/open-questions.md)]
7. Supabase에 embedding_model 저장
8. status를 done으로. 실패 시 failed + error_message 저장
9. done이고 source_url이 있는 파일 기록이면 Storage 원본 삭제

# AI 분석 흐름 ('AI 분석하기'·다시 분석·챗봇 요청 때만)
1. apps/web에서 분석 요청 수신 (X-Worker-Secret). analysis_status는 웹 서버가 analyzing으로 바꿔 둔다
2. 글자를 다시 읽는다: Storage 원본, 원본이 지워진 출처 링크 파일·URL·영상은 원문을 다시 가져옴 (원문 글은 저장하지 않음)
3. 파일 여러 개 + 메모(original_context)를 합쳐 AI 정리글 1개 생성 (양식: docs/database.md). 전체는 summary_detail, 한 줄 요약 + 핵심 포인트는 summary
4. 요약본 벡터 1개(one_line + key_points + use_when)를 기존 요약본 벡터를 지운 뒤 Qdrant에 저장
5. summary·summary_detail·analyzed_at, analyzed_context(분석 때 메모) 저장, analysis_moved_at 비움, analysis_status done. 실패 시 failed
- 저장 직전 status가 deleting이거나 기록이 없으면 멈춘다

# FastAPI 규칙
- 요청·응답 형식은 Pydantic 모델로 선언한다. 웹 서버와의 약속이므로 바꾸면 apps/web의 호출 코드도 같은 PR에서 수정
- OCR, PDF 추출처럼 CPU를 오래 쓰는 작업을 async def 안에서 직접 실행하지 말 것 (그동안 서버 전체가 멈춤). 가공 함수는 일반 def로 두고 백그라운드에서 실행
- [확인 필요: 백그라운드 실행 방식과 동시 처리 개수. BackgroundTasks, 프로세스 풀, DB의 queued 상태를 대기열로 쓰는 방식 중 선택]

# Qdrant 규칙
- 기록 1개에서 벡터가 여러 개 나온다. 벡터 식별값을 기록 식별값과 같게 쓰지 말 것
- payload 필수: user_id, record_id, group_id, vector_kind(summary 또는 chunk). chunk는 chunk_index도 저장
- group_id는 Qdrant에 저장하기 직전에 DB에서 현재 값을 다시 읽어 넣는다 (가공 중 그룹이 바뀌어도 옛 값이 들어가지 않게)
- 같은 시점에 status도 다시 확인한다. deleting이거나 기록이 없으면 Qdrant에 저장하지 않고 가공을 멈춘다 (가공 중 삭제 대비)
- 같은 기록을 다시 처리하면 그 record_id의 기존 벡터를 지운 뒤 새로 저장 (조각 수가 바뀔 수 있음)
- 원문 조각 글은 payload에 넣지 않는다 (URL 원문 미저장 결정)
- Supabase 저장이 먼저, Qdrant 저장은 그 다음. Qdrant에만 있는 데이터를 만들지 말 것

# 재처리
- 주기적으로 오래 queued 또는 processing인 기록을 찾아 다시 처리. deleting인 기록은 가공 대상에서 뺀다
- 같은 기록을 여러 번 처리해도 결과가 같아야 한다 (멱등성)

# 파일 규칙
- 원본 파일: 출처 링크(source_url)가 있는 파일은 가공 성공(done) 후 Storage 원본을 지우고 출처 링크로 본다. 출처 링크가 없는 파일(내 컴퓨터에서 올린 파일, 화면 캡처)은 원본을 유지한다. 가공에 실패한 파일은 지우지 않는다
- 원본 삭제는 Supabase에 done을 저장한 뒤 마지막 단계에서 한다 [확인 필요: 삭제 후 file_path를 비울지, 삭제 시각을 따로 남길지]
- 타입별 추출 로직은 processors/ 폴더에 함수로 분리. FastAPI 경로 함수에 직접 작성 금지
- OpenAI·Supabase·Qdrant 키와 X-Worker-Secret은 환경변수로만 읽기

# 테스트
- processors/ 함수는 pytest로 테스트 (샘플 파일은 tests/fixtures/)
- API는 FastAPI의 TestClient로 테스트 (X-Worker-Secret 거부 확인 포함)

# 미정 — 구현 전에 사용자에게 선택지를 주고 물어볼 것
- 재시도 방식, 원문을 가져올 수 없는 링크(인스타그램, 유료 기사) 처리
- 자막이 없는 영상의 음성 변환 방법, 영상 길이 제한
- 요약본 벡터와 원문 조각 벡터를 둘 컬렉션 구성 (하나 또는 둘)
- 요약본이 없는 하이라이트·메모의 벡터 재료
- 메모도 요약할지
- AI 정리글의 MVP 항목 범위, 자료 유형 목록 (관련 직군은 AI가 기록마다 정말 관련 있는 것만 최대 2개 판단, 키워드에 섞지 않음)
- '분류 안 된 기록'의 가공 후 그룹 추천을 가공 서버에서 할지
- 임베딩 모델 이름을 웹과 함께 쓰는 설정 위치
