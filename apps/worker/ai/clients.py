"""AI 회사별 SDK 연결. 가공 서버의 모든 AI 일(그림 설명, 그룹 추천, AI 분석)이 함께 쓴다.

SDK는 쓰는 것만 불러온다. 쓰는 쪽은 `_openai_client`처럼 밑줄 이름으로 가져오고, 테스트는 그 이름을 가짜로 바꾼다.
"""

import config

# 클로드 모델 중 요청이 거절됐을 때 서버가 다른 모델로 이어 주는 기능(fallbacks)을 받는 모델
CLAUDE_FALLBACK_MODELS = {
    "claude-fable-5-2",
    "claude-fable-5-1",
    "claude-opus-5-5",
    "claude-opus-5",
    "claude-sonnet-5-5",
}


def openai_client(api_key: str):
    from openai import OpenAI

    return OpenAI(api_key=api_key, timeout=config.AI_TIMEOUT_SECONDS, max_retries=1)


def claude_client(api_key: str):
    from anthropic import Anthropic

    return Anthropic(api_key=api_key, timeout=config.AI_TIMEOUT_SECONDS, max_retries=1)


def gemini_client(api_key: str):
    from google import genai

    return genai.Client(api_key=api_key)
