"""svg: 파일 안에 적힌 글자를 그대로 뽑고, 그림 설명(vision.py)을 덧붙인다.

- 글자: 파일에 글자로 적혀 있는 것만 뽑는다. 글자를 윤곽선(도형)으로 바꿔 내보낸 svg는 나오지 않는다.
  그런 파일을 OCR로 읽는 2단계는 만들어 두고 꺼 놓았다 (config.SVG_OCR_ENABLED)
- 그림 설명: jpeg·png와 같다. svg를 그림으로 바꿔 AI에 보낸다 (cairosvg와 서버의 cairo 라이브러리 필요)
"""

import logging
from io import BytesIO

from PIL import Image

import config

from . import html, image, vision

logger = logging.getLogger(__name__)


def _to_image(data: bytes) -> Image.Image:
    import cairosvg

    # 바깥 파일·주소를 끌어오지 않는 기본 설정(unsafe=False)으로 그린다. 작은 아이콘도 알아볼 수 있게 폭을 맞춘다
    png = cairosvg.svg2png(
        bytestring=data, background_color="white", output_width=config.VISION_MAX_EDGE
    )
    return Image.open(BytesIO(png))


def extract_text(data: bytes) -> str:
    text = html.extract_text(data)
    need_ocr = not text and config.SVG_OCR_ENABLED
    if not need_ocr and not vision.is_active():
        return text
    try:
        picture = _to_image(data)
    except Exception as e:
        # 그림으로 못 바꿔도 파일 안의 글자만으로 가공을 끝낸다
        logger.warning("svg를 그림으로 바꾸지 못함: %s", type(e).__name__)
        return text
    if need_ocr:
        text = image.ocr(picture)
    return "\n\n".join(part for part in (vision.describe_image(picture), text) if part)
