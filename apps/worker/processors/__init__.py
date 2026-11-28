"""형식별 글자 추출. 함수는 bytes(또는 주소)를 받아 글자를 돌려주고, 저장소를 모른다."""

from collections.abc import Callable


class ProcessingError(Exception):
    """가공을 끝낼 수 없는 이유. 메시지는 기록의 error_message에 그대로 저장된다."""


from . import html, image, pdf, svg, text  # noqa: E402  (ProcessingError를 먼저 정의해야 한다)

EXTRACTORS: dict[str, Callable[[bytes], str]] = {
    "txt": text.extract_text,
    "md": text.extract_text,
    "csv": text.extract_text,
    "pdf": pdf.extract_text,
    "html": html.extract_text,
    "svg": svg.extract_text,
    "jpeg": image.extract_text,
    "jpg": image.extract_text,
    "png": image.extract_text,
}


def extract_file_text(file_type: str, data: bytes) -> str:
    extractor = EXTRACTORS.get(file_type.lower())
    if extractor is None:
        raise ProcessingError(f"지원하지 않는 파일 형식: {file_type}")
    return extractor(data)
