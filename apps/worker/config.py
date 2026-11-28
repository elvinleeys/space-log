"""환경변수와 설정값은 여기서만 읽는다."""

import os

# 원문 조각 하나의 글자 수 (문단을 이 크기 안팎으로 묶는다)
CHUNK_SIZE = 1000

# 주소에서 원문을 가져올 때의 제한
FETCH_TIMEOUT_SECONDS = 10
FETCH_MAX_BYTES = 5 * 1024 * 1024
FETCH_MAX_REDIRECTS = 5

# svg에서 글자가 안 나올 때 그림으로 바꿔 OCR로 읽을지. 지금은 끈다 (파일 안의 글자만 뽑는다)
SVG_OCR_ENABLED = False

# Tesseract가 읽을 언어
OCR_LANGUAGES = "kor+eng"

# 유튜브 자막을 찾을 언어 순서
TRANSCRIPT_LANGUAGES = ("ko", "en")

# Storage 버킷 이름 (apps/web의 RECORDS_BUCKET과 같다)
RECORDS_BUCKET = "records"


def worker_secret() -> str:
    return os.environ.get("WORKER_SECRET", "")


def store_kind() -> str:
    return os.environ.get("WORKER_STORE", "supabase")


def supabase_credentials() -> tuple[str, str]:
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SECRET_KEY", "")
    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL, SUPABASE_SECRET_KEY 환경변수가 필요합니다. "
            "Supabase 없이 띄우려면 WORKER_STORE=memory 로 실행하세요."
        )
    return url, key
