"""PDF: 쪽마다 글자를 뽑는다. 스캔한 PDF(그림만 있는 PDF)는 글자가 나오지 않는다."""

from io import BytesIO

from pypdf import PdfReader
from pypdf.errors import PyPdfError

from . import ProcessingError


def extract_text(data: bytes) -> str:
    try:
        reader = PdfReader(BytesIO(data))
        pages = [page.extract_text() or "" for page in reader.pages]
    except (PyPdfError, ValueError) as e:
        raise ProcessingError("PDF를 읽지 못함") from e
    return "\n\n".join(p.strip() for p in pages if p.strip())
