"""글을 보내고 글로 답을 받는다 (그룹 추천, AI 분석).

- 어느 AI를 쓸지: 환경변수 AI_PROVIDER (openai, claude, gemini)와 AI_API_KEY
- 모델: 일마다 따로 (config.AI_TASK_MODEL_ENV). 비우면 그 회사의 기본 모델
- 키가 있으면 사용자의 기록 내용이 그 AI 회사로 전송된다. 키가 없으면 아무것도 보내지 않는다
- 다른 AI를 더하려면 아래에 함수 하나를 쓰고 PROVIDERS에 넣는다
"""

import logging
from collections.abc import Callable

import config

from .clients import CLAUDE_FALLBACK_MODELS
from .clients import claude_client as _claude_client
from .clients import gemini_client as _gemini_client
from .clients import openai_client as _openai_client

logger = logging.getLogger(__name__)


def _with_openai(prompt: str, api_key: str, model: str) -> str:
    response = _openai_client(api_key).responses.create(model=model, input=prompt)
    return response.output_text or ""


def _with_claude(prompt: str, api_key: str, model: str) -> str:
    request = {
        "model": model,
        "max_tokens": 16000,
        # 고르기와 짧은 요약이라 깊이 생각할 필요가 없다
        "output_config": {"effort": "low"},
        "messages": [{"role": "user", "content": prompt}],
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


def _with_gemini(prompt: str, api_key: str, model: str) -> str:
    response = _gemini_client(api_key).models.generate_content(
        model=model, contents=prompt
    )
    return response.text or ""


PROVIDERS: dict[str, Callable[[str, str, str], str]] = {
    "openai": _with_openai,
    "claude": _with_claude,
    "gemini": _with_gemini,
}


def is_active() -> bool:
    return bool(config.ai_api_key())


def generate_text(task: str, prompt: str) -> str:
    """task는 config.AI_TASK_MODEL_ENV의 키. 답을 받지 못하면 ""를 돌려준다 (키 없음, 모르는 회사, 호출 오류, 거절)."""
    if not is_active():
        return ""
    name = config.ai_provider()
    provider = PROVIDERS.get(name)
    if provider is None:
        logger.warning("AI 글 호출: 모르는 AI_PROVIDER 값 %r", name)
        return ""
    try:
        return provider(prompt, config.ai_api_key(), config.ai_model(task)).strip()
    except Exception as e:
        # 세 회사의 오류 종류가 달라 한꺼번에 받는다. 기록 내용이 섞일 수 있어 오류 글은 남기지 않는다
        logger.warning("AI 답을 받지 못함 (%s, %s): %s", name, task, type(e).__name__)
        return ""
