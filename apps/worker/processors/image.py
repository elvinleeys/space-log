"""jpeg, jpg, png: OCR로 글자를 읽는다. OCR 도구를 바꾸려면 이 파일만 바꾼다."""

from io import BytesIO

import pytesseract
from PIL import Image, UnidentifiedImageError

import config

from . import ProcessingError


def extract_text(data: bytes) -> str:
    try:
        image = Image.open(BytesIO(data))
        # 자동 배치 분석(psm 3)은 글자가 크고 한 줄뿐인 그림을 빈 쪽으로 보는 일이 있다.
        # 그때는 그림 전체를 글 한 덩어리로 보고(psm 6) 다시 읽는다
        for psm in (3, 6):
            text = pytesseract.image_to_string(
                image, lang=config.OCR_LANGUAGES, config=f"--psm {psm}"
            ).strip()
            if text:
                return text
        return ""
    except pytesseract.TesseractNotFoundError as e:
        raise ProcessingError("OCR 프로그램(Tesseract)이 설치되지 않음") from e
    except pytesseract.TesseractError as e:
        raise ProcessingError("이미지의 글자를 읽지 못함") from e
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError) as e:
        raise ProcessingError("이미지를 열지 못함") from e
