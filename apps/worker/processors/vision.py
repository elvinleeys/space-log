"""이미지가 무엇을 담고 있는지 AI에게 글로 설명받는다. 글자가 없는 사진·도표·시안도 내용으로 찾을 수 있게 한다.

- 켜고 끄기: config.IMAGE_DESCRIPTION_ENABLED
- 어느 AI를 쓸지: 환경변수 AI_PROVIDER (openai, claude, gemini)와 AI_API_KEY. 가공 서버의 다른 AI 일과 함께 쓴다
- 모델: 환경변수 VISION_MODEL. 비우면 그 회사의 기본 모델 (config.py)
- 켜져 있고 키가 있으면 사용자의 이미지가 그 AI 회사로 전송된다. 키가 없으면 아무것도 보내지 않는다
- 다른 AI를 더하려면 아래에 함수 하나를 쓰고 PROVIDERS에 넣는다
"""

import base64
import logging
from collections.abc import Callable
from io import BytesIO

from PIL import Image

import config
from ai.clients import CLAUDE_FALLBACK_MODELS

# 테스트에서는 아래 _*_client를 가짜로 바꾼다
from ai.clients import claude_client as _claude_client
from ai.clients import gemini_client as _gemini_client
from ai.clients import openai_client as _openai_client

logger = logging.getLogger(__name__)

PROMPT = (
    "이 그림이 무엇을 담고 있는지 한국어로 3~5문장으로 설명해 줘. "
    "화면 캡처면 어떤 서비스의 어떤 화면인지, 도표면 무엇을 나타내는지, "
    "사진이면 무엇이 찍혔는지, 디자인 시안이면 구성과 분위기를 적어 줘. "
    "나중에 이 그림을 검색으로 다시 찾을 때 쓸 설명이야. "
    "그림에 보이지 않는 것은 지어내지 말고, 설명만 써 줘."
)

def _to_jpeg(image: Image.Image) -> bytes:
    """보내는 크기와 비용을 줄이려고 긴 변을 줄이고 JPEG로 바꾼다."""
    image = image.copy()
    image.thumbnail((config.VISION_MAX_EDGE, config.VISION_MAX_EDGE))
    if image.mode != "RGB":
        # 투명한 곳은 흰 바탕으로 채운다
        rgba = image.convert("RGBA")
        background = Image.new("RGB", rgba.size, "white")
        background.paste(rgba, mask=rgba.split()[-1])
        image = background
    buffer = BytesIO()
    image.save(buffer, format="JPEG", quality=85)
    return buffer.getvalue()


def _describe_with_openai(jpeg: bytes, api_key: str, model: str) -> str:
    data_url = "data:image/jpeg;base64," + base64.b64encode(jpeg).decode()
    response = _openai_client(api_key).responses.create(
        model=model,
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": PROMPT},
                    {"type": "input_image", "image_url": data_url},
                ],
            }
        ],
    )
    return response.output_text or ""


def _describe_with_claude(jpeg: bytes, api_key: str, model: str) -> str:
    request = {
        "model": model,
        "max_tokens": 4096,
        # 짧은 설명이라 깊이 생각할 필요가 없다
        "output_config": {"effort": "low"},
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": base64.standard_b64encode(jpeg).decode(),
                        },
                    },
                    {"type": "text", "text": PROMPT},
                ],
            }
        ],
    }
    client = _claude_client(api_key)
    if model in CLAUDE_FALLBACK_MODELS:
        # 안전 검사로 거절되면 서버가 다른 모델로 같은 요청을 이어서 처리한다
        response = client.beta.messages.create(
            betas=["server-side-fallback-2026-07-01"], fallbacks="default", **request
        )
    else:
        response = client.messages.create(**request)
    if response.stop_reason == "refusal":
        return ""
    return "".join(block.text for block in response.content if block.type == "text")


def _describe_with_gemini(jpeg: bytes, api_key: str, model: str) -> str:
    from google.genai import types

    response = _gemini_client(api_key).models.generate_content(
        model=model,
        contents=[types.Part.from_bytes(data=jpeg, mime_type="image/jpeg"), PROMPT],
    )
    return response.text or ""


PROVIDERS: dict[str, Callable[[bytes, str, str], str]] = {
    "openai": _describe_with_openai,
    "claude": _describe_with_claude,
    "gemini": _describe_with_gemini,
}


def is_active() -> bool:
    """그림 설명을 실제로 받는 상태인지: 켜져 있고 키가 있다."""
    return config.IMAGE_DESCRIPTION_ENABLED and bool(config.ai_api_key())


def describe_image(image: Image.Image) -> str:
    if not is_active():
        return ""
    api_key = config.ai_api_key()
    name = config.ai_provider()
    provider = PROVIDERS.get(name)
    if provider is None:
        logger.warning("그림 설명: 모르는 AI_PROVIDER 값 %r", name)
        return ""
    try:
        return provider(_to_jpeg(image), api_key, config.ai_model("vision")).strip()
    except Exception as e:
        # 설명은 덧붙이는 재료다. 세 회사의 오류 종류가 달라 한꺼번에 받고, 못 받아도 글자(OCR)만으로 가공을 끝낸다
        logger.warning("그림 설명을 받지 못함 (%s): %s", name, type(e).__name__)
        return ""
