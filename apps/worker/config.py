"""환경변수와 설정값은 여기서만 읽는다."""

import os

# 원문 조각 하나의 글자 수 (문단을 이 크기 안팎으로 묶는다)
CHUNK_SIZE = 1000

# 주소에서 원문을 가져올 때의 제한
FETCH_TIMEOUT_SECONDS = 10
FETCH_MAX_BYTES = 5 * 1024 * 1024
FETCH_MAX_REDIRECTS = 5

# 이미지가 무엇을 담고 있는지 AI 설명을 받을지 (processors/vision.py). False면 그림 속 글자(OCR)만 쓴다
IMAGE_DESCRIPTION_ENABLED = True
# 그림 설명에 보내는 그림의 긴 변과 기다리는 시간
VISION_MAX_EDGE = 1536
VISION_TIMEOUT_SECONDS = 30

# svg에서 글자가 안 나올 때 그림으로 바꿔 OCR로 읽을지. 지금은 끈다 (파일 안의 글자만 뽑는다. 그림 설명은 위 설정을 따른다)
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


# AI 회사와 키는 가공 서버의 모든 AI 일이 함께 쓰고, 모델만 일마다 따로 고른다.
#   AI_PROVIDER      openai, claude, gemini 중 하나
#   AI_API_KEY       그 회사의 키
#   VISION_MODEL     그림 설명에 쓸 모델
#   RECOMMEND_MODEL  그룹 추천에 쓸 모델 (추천은 아직 만들지 않았다. 만들 때 ai_model("recommend")로 읽는다)
# 일의 모델을 비워 두면 그 회사의 기본 모델을 쓴다
AI_DEFAULT_MODELS = {
    "openai": "gpt-6.2-astra",
    "claude": "claude-opus-5-5",
    "gemini": "gemini-3.8-flash",
}
AI_TASK_MODEL_ENV = {"vision": "VISION_MODEL", "recommend": "RECOMMEND_MODEL"}


def ai_provider() -> str:
    return os.environ.get("AI_PROVIDER") or "openai"


def ai_api_key() -> str:
    """비어 있으면 AI를 부르지 않는다 (그림도 글도 바깥으로 보내지 않는다)."""
    return os.environ.get("AI_API_KEY", "")


def ai_model(task: str) -> str:
    """task는 AI_TASK_MODEL_ENV의 키. 모르는 일이면 KeyError로 바로 알린다."""
    return os.environ.get(AI_TASK_MODEL_ENV[task]) or AI_DEFAULT_MODELS.get(
        ai_provider(), ""
    )


def supabase_credentials() -> tuple[str, str]:
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SECRET_KEY", "")
    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL, SUPABASE_SECRET_KEY 환경변수가 필요합니다. "
            "Supabase 없이 띄우려면 WORKER_STORE=memory 로 실행하세요."
        )
    return url, key
