from pathlib import Path
from shutil import which

import pytest

from processors import ProcessingError, extract_file_text

FIXTURES = Path(__file__).parent / "fixtures"


def read(name: str) -> bytes:
    return (FIXTURES / name).read_bytes()


def test_txt와_md는_글자를_그대로_읽는다():
    assert "두 번째 문단" in extract_file_text("txt", read("sample.txt"))
    assert "맥락을 먼저 설명한다" in extract_file_text("md", read("sample.md"))


def test_엑셀에서_저장한_cp949_csv도_읽는다():
    assert extract_file_text("csv", read("sample_cp949.csv")) == "이름,점수\n가영,90\n"


def test_확장자는_대소문자를_가리지_않는다():
    assert "두 번째 문단" in extract_file_text("TXT", read("sample.txt"))


def test_pdf에서_글자를_뽑는다():
    assert "Hello Spacelog PDF" in extract_file_text("pdf", read("sample.pdf"))


def test_깨진_pdf는_가공_실패다():
    with pytest.raises(ProcessingError):
        extract_file_text("pdf", b"not a pdf")


def test_html은_보이는_글자만_남긴다():
    text = extract_file_text("html", read("sample.html"))
    assert "별자리 안내" in text and "보이는 본문입니다." in text
    assert "숨은 글" not in text and "color:red" not in text


def test_svg는_OCR_없이_안의_글자를_뽑는다():
    assert extract_file_text("svg", read("sample.svg")) == "SVG 안의 글자"


OUTLINED_SVG = b'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h9v9z"/></svg>'


@pytest.fixture
def svg_module(monkeypatch):
    """svg를 그림으로 바꾸는 부분과 그림 설명을 가짜로 바꾼다. 불린 횟수를 센다."""
    from processors import image, svg, vision

    calls = {"render": 0}

    def render(data):
        calls["render"] += 1
        return "그림"

    monkeypatch.setattr(svg, "_to_image", render)
    monkeypatch.setattr(image, "ocr", lambda picture: "OCR로 읽은 글자")
    monkeypatch.setattr(vision, "is_active", lambda: False)
    # 실제 함수처럼, 그림 설명이 꺼져 있으면 빈 글을 돌려준다
    monkeypatch.setattr(
        vision,
        "describe_image",
        lambda picture: "아이콘 그림이다." if vision.is_active() else "",
    )
    return calls


def test_svg는_그림_설명도_OCR도_꺼져_있으면_그림으로_바꾸지_않는다(svg_module):
    assert extract_file_text("svg", OUTLINED_SVG) == ""
    assert extract_file_text("svg", read("sample.svg")) == "SVG 안의 글자"
    assert svg_module["render"] == 0


def test_svg도_그림_설명을_받아_파일_안의_글자와_함께_쓴다(svg_module, monkeypatch):
    from processors import vision

    monkeypatch.setattr(vision, "is_active", lambda: True)
    assert extract_file_text("svg", read("sample.svg")) == "아이콘 그림이다.\n\nSVG 안의 글자"
    # 글자가 없는 svg는 설명만. OCR은 꺼져 있어 쓰지 않는다
    assert extract_file_text("svg", OUTLINED_SVG) == "아이콘 그림이다."


def test_svg_OCR을_켜면_글자가_없을_때만_OCR로_읽는다(svg_module, monkeypatch):
    import config

    monkeypatch.setattr(config, "SVG_OCR_ENABLED", True)
    assert extract_file_text("svg", OUTLINED_SVG) == "OCR로 읽은 글자"
    assert extract_file_text("svg", read("sample.svg")) == "SVG 안의 글자"
    assert svg_module["render"] == 1


def test_svg를_그림으로_못_바꿔도_파일_안의_글자로_끝낸다(svg_module, monkeypatch):
    from processors import svg, vision

    def broken(data):
        raise ValueError("그릴 수 없음")

    monkeypatch.setattr(svg, "_to_image", broken)
    monkeypatch.setattr(vision, "is_active", lambda: True)
    assert extract_file_text("svg", read("sample.svg")) == "SVG 안의 글자"


def test_svg를_실제로_그림으로_바꾼다():
    pytest.importorskip("cairosvg")
    import config
    from processors import svg

    picture = svg._to_image(read("sample.svg"))
    assert picture.width == config.VISION_MAX_EDGE and picture.height > 0


def test_지원하지_않는_형식은_가공_실패다():
    with pytest.raises(ProcessingError):
        extract_file_text("zip", b"")


def test_빈_파일은_빈_글자다():
    assert extract_file_text("txt", b"") == ""


@pytest.mark.skipif(which("tesseract") is None, reason="Tesseract가 설치되지 않음")
def test_그림의_글자를_OCR로_읽는다():
    assert "SPACELOG" in extract_file_text("png", read("text.png"))


@pytest.mark.skipif(
    which("tesseract") is None
    or "kor" not in __import__("pytesseract").get_languages(),
    reason="Tesseract 한국어 데이터가 설치되지 않음",
)
def test_한글_그림도_OCR로_읽는다():
    # 글자가 크고 한 줄뿐인 그림: 자동 배치 분석이 놓치는 경우
    assert "우주 기록 저장 완료" in extract_file_text("png", read("text_ko.png"))


def test_그림이_아닌_파일은_가공_실패다():
    with pytest.raises(ProcessingError):
        extract_file_text("png", b"not an image")
