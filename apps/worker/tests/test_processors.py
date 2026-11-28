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


def test_svg_OCR은_꺼져_있어서_글자가_없는_svg는_빈_글자다(monkeypatch):
    from processors import svg

    def never(data):
        raise AssertionError("꺼져 있는 동안 OCR을 부르면 안 된다")

    monkeypatch.setattr(svg, "_ocr", never)
    outlined = b'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h9v9z"/></svg>'
    assert extract_file_text("svg", outlined) == ""


def test_svg_OCR을_켜면_글자가_없을_때만_OCR로_넘어간다(monkeypatch):
    import config
    from processors import svg

    monkeypatch.setattr(config, "SVG_OCR_ENABLED", True)
    monkeypatch.setattr(svg, "_ocr", lambda data: "OCR로 읽은 글자")
    outlined = b'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h9v9z"/></svg>'
    assert extract_file_text("svg", outlined) == "OCR로 읽은 글자"
    assert extract_file_text("svg", read("sample.svg")) == "SVG 안의 글자"


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
