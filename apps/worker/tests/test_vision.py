import base64
from io import BytesIO
from pathlib import Path
from types import SimpleNamespace

import pytest
from PIL import Image

import config
from processors import extract_file_text, image, vision

FIXTURES = Path(__file__).parent / "fixtures"
TEXT = "로그인 화면 시안이다."


def picture(mode="RGB", size=(3000, 1000)) -> Image.Image:
    return Image.new(mode, size, "white")


class Recorder:
    """AI SDK 흉내: 어떤 경로로 불렸는지와 받은 값을 기억하고, 정해 둔 응답을 돌려준다."""

    def __init__(self, response):
        self.response = response
        self.calls: list[tuple[str, dict]] = []
        self._path = ""

    def __getattr__(self, name):
        child = Recorder(self.response)
        child.calls = self.calls
        child._path = f"{self._path}.{name}".lstrip(".")
        return child

    def __call__(self, **kwargs):
        self.calls.append((self._path, kwargs))
        if isinstance(self.response, Exception):
            raise self.response
        return self.response


def use(monkeypatch, provider: str, response, model: str | None = None) -> Recorder:
    fake = Recorder(response)
    monkeypatch.setenv("VISION_PROVIDER", provider)
    monkeypatch.setenv("VISION_API_KEY", "test-key")
    if model:
        monkeypatch.setenv("VISION_MODEL", model)
    else:
        monkeypatch.delenv("VISION_MODEL", raising=False)
    monkeypatch.setattr(vision, f"_{provider}_client", lambda api_key: fake)
    return fake


def forbid_clients(monkeypatch):
    def never(api_key):
        raise AssertionError("AI를 부르면 안 된다")

    for name in ("openai", "claude", "gemini"):
        monkeypatch.setattr(vision, f"_{name}_client", never)


def test_키가_없으면_그림을_보내지_않는다(monkeypatch):
    monkeypatch.delenv("VISION_API_KEY", raising=False)
    forbid_clients(monkeypatch)
    assert vision.describe_image(picture()) == ""


def test_기능을_끄면_키가_있어도_그림을_보내지_않는다(monkeypatch):
    monkeypatch.setenv("VISION_API_KEY", "test-key")
    monkeypatch.setattr(config, "IMAGE_DESCRIPTION_ENABLED", False)
    forbid_clients(monkeypatch)
    assert vision.describe_image(picture()) == ""


def test_기본값은_켜져_있고_openai다(monkeypatch):
    monkeypatch.delenv("VISION_PROVIDER", raising=False)
    assert config.IMAGE_DESCRIPTION_ENABLED is True
    assert config.vision_provider() == "openai"


def test_모르는_AI_이름이면_보내지_않는다(monkeypatch):
    monkeypatch.setenv("VISION_PROVIDER", "없는-ai")
    monkeypatch.setenv("VISION_API_KEY", "test-key")
    forbid_clients(monkeypatch)
    assert vision.describe_image(picture()) == ""


def test_openai로_줄인_JPEG를_보내고_설명을_받는다(monkeypatch):
    fake = use(monkeypatch, "openai", SimpleNamespace(output_text=TEXT))
    assert vision.describe_image(picture()) == TEXT
    path, call = fake.calls[0]
    assert path == "responses.create"
    assert call["model"] == config.VISION_DEFAULT_MODELS["openai"]
    text, sent = call["input"][0]["content"]
    assert text["type"] == "input_text" and "설명" in text["text"]
    prefix = "data:image/jpeg;base64,"
    assert sent["type"] == "input_image" and sent["image_url"].startswith(prefix)
    shrunk = Image.open(BytesIO(base64.b64decode(sent["image_url"][len(prefix):])))
    assert max(shrunk.size) == config.VISION_MAX_EDGE


def claude_response(stop_reason="end_turn"):
    return SimpleNamespace(
        stop_reason=stop_reason,
        content=[
            SimpleNamespace(type="thinking", thinking=""),
            SimpleNamespace(type="text", text=TEXT),
        ],
    )


def test_claude_기본_모델은_거절_대비를_켜고_보낸다(monkeypatch):
    fake = use(monkeypatch, "claude", claude_response())
    assert vision.describe_image(picture()) == TEXT
    path, call = fake.calls[0]
    assert path == "beta.messages.create"
    assert call["model"] == "claude-opus-5-5"
    assert call["fallbacks"] == "default"
    assert call["betas"] == ["server-side-fallback-2026-07-01"]
    picture_block, text_block = call["messages"][0]["content"]
    assert picture_block["source"]["media_type"] == "image/jpeg"
    assert Image.open(BytesIO(base64.b64decode(picture_block["source"]["data"]))).format == "JPEG"
    assert text_block["type"] == "text"


def test_claude_다른_모델은_일반_경로로_보낸다(monkeypatch):
    fake = use(monkeypatch, "claude", claude_response(), model="claude-haiku-5-5")
    assert vision.describe_image(picture()) == TEXT
    path, call = fake.calls[0]
    assert path == "messages.create"
    assert call["model"] == "claude-haiku-5-5" and "fallbacks" not in call


def test_claude가_거절하면_빈_글이다(monkeypatch):
    use(monkeypatch, "claude", claude_response(stop_reason="refusal"))
    assert vision.describe_image(picture()) == ""


def test_gemini로_JPEG를_보내고_설명을_받는다(monkeypatch):
    fake = use(monkeypatch, "gemini", SimpleNamespace(text=TEXT))
    assert vision.describe_image(picture()) == TEXT
    path, call = fake.calls[0]
    assert path == "models.generate_content"
    assert call["model"] == config.VISION_DEFAULT_MODELS["gemini"]
    part, prompt = call["contents"]
    assert part.inline_data.mime_type == "image/jpeg" and "설명" in prompt


def test_투명한_png도_보낼_수_있다(monkeypatch):
    use(monkeypatch, "openai", SimpleNamespace(output_text=TEXT))
    assert vision.describe_image(picture("RGBA", (200, 100))) == TEXT


@pytest.mark.parametrize("provider", ["openai", "claude", "gemini"])
def test_AI_호출이_실패해도_오류를_내지_않고_빈_글을_돌려준다(monkeypatch, provider):
    use(monkeypatch, provider, RuntimeError("연결 끊김"))
    assert vision.describe_image(picture()) == ""


def test_이미지_기록은_그림_설명과_그림_속_글자를_함께_쓴다(monkeypatch):
    monkeypatch.setattr(image, "ocr", lambda img: "SPACELOG 2026")
    monkeypatch.setattr(vision, "describe_image", lambda img: "흰 바탕에 큰 글자가 있다.")
    data = (FIXTURES / "text.png").read_bytes()
    assert extract_file_text("png", data) == "흰 바탕에 큰 글자가 있다.\n\nSPACELOG 2026"


def test_글자가_없는_그림은_설명만_쓴다(monkeypatch):
    monkeypatch.setattr(image, "ocr", lambda img: "")
    monkeypatch.setattr(vision, "describe_image", lambda img: "강아지 사진이다.")
    data = (FIXTURES / "text.png").read_bytes()
    assert extract_file_text("png", data) == "강아지 사진이다."
