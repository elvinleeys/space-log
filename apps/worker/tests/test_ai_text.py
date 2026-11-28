from types import SimpleNamespace

import pytest

import config
from ai import text
from tests.test_vision import Recorder


def use(monkeypatch, provider: str, response, model: str | None = None) -> Recorder:
    fake = Recorder(response)
    monkeypatch.setenv("AI_PROVIDER", provider)
    monkeypatch.setenv("AI_API_KEY", "test-key")
    if model:
        monkeypatch.setenv("RECOMMEND_MODEL", model)
    else:
        monkeypatch.delenv("RECOMMEND_MODEL", raising=False)
    monkeypatch.setattr(text, f"_{provider}_client", lambda api_key: fake)
    return fake


def claude_response(stop_reason="end_turn"):
    return SimpleNamespace(
        stop_reason=stop_reason,
        content=[
            SimpleNamespace(type="thinking", thinking=""),
            SimpleNamespace(type="text", text=" 2 "),
        ],
    )


def test_키가_없으면_아무것도_보내지_않는다(monkeypatch):
    monkeypatch.delenv("AI_API_KEY", raising=False)
    for name in ("openai", "claude", "gemini"):
        monkeypatch.setattr(text, f"_{name}_client", lambda api_key: pytest.fail("부르면 안 된다"))
    assert text.generate_text("recommend", "질문") == ""


def test_모르는_AI_이름이면_보내지_않는다(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "없는-ai")
    monkeypatch.setenv("AI_API_KEY", "test-key")
    assert text.generate_text("recommend", "질문") == ""


def test_openai로_글을_보내고_답을_받는다(monkeypatch):
    fake = use(monkeypatch, "openai", SimpleNamespace(output_text=" 2 "))
    assert text.generate_text("recommend", "질문") == "2"
    path, call = fake.calls[0]
    assert path == "responses.create"
    assert call == {"model": config.AI_DEFAULT_MODELS["openai"], "input": "질문"}


def test_claude_기본_모델은_거절_대비를_켜고_보낸다(monkeypatch):
    fake = use(monkeypatch, "claude", claude_response())
    assert text.generate_text("recommend", "질문") == "2"
    path, call = fake.calls[0]
    assert path == "beta.messages.create"
    assert call["model"] == "claude-opus-5-5"
    assert call["fallbacks"] == "default"
    assert call["betas"] == ["server-side-fallback-2026-07-01"]
    assert call["messages"] == [{"role": "user", "content": "질문"}]


def test_claude_다른_모델은_거절_대비_없이_보낸다(monkeypatch):
    fake = use(monkeypatch, "claude", claude_response(), model="claude-haiku-5-5")
    assert text.generate_text("recommend", "질문") == "2"
    path, call = fake.calls[0]
    assert path == "messages.create"
    assert call["model"] == "claude-haiku-5-5" and "fallbacks" not in call


def test_claude가_거절하면_빈_글이다(monkeypatch):
    use(monkeypatch, "claude", claude_response(stop_reason="refusal"))
    assert text.generate_text("recommend", "질문") == ""


def test_gemini로_글을_보내고_답을_받는다(monkeypatch):
    fake = use(monkeypatch, "gemini", SimpleNamespace(text="2"))
    assert text.generate_text("recommend", "질문") == "2"
    path, call = fake.calls[0]
    assert path == "models.generate_content"
    assert call == {"model": config.AI_DEFAULT_MODELS["gemini"], "contents": "질문"}


def test_호출이_실패하면_빈_글이다(monkeypatch):
    use(monkeypatch, "openai", RuntimeError("timeout"))
    assert text.generate_text("recommend", "질문") == ""
