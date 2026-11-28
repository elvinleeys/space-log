"""svg: 파일 안에 적힌 글자를 그대로 뽑는다.

글자를 윤곽선(도형)으로 바꿔 내보낸 svg는 글자가 나오지 않는다. 그런 파일을 그림으로 바꿔 OCR로 읽는
2단계는 만들어 두고 꺼 놓았다 (config.SVG_OCR_ENABLED). 켜려면 requirements.txt의 안내를 본다.
"""

import config

from . import ProcessingError, html, image


def extract_text(data: bytes) -> str:
    text = html.extract_text(data)
    if text or not config.SVG_OCR_ENABLED:
        return text
    return _ocr(data)


def _ocr(data: bytes) -> str:
    # 꺼져 있는 동안에는 설치하지 않아도 되게, 쓸 때 불러온다
    import cairosvg

    try:
        # 바깥 파일·주소를 끌어오지 않는 기본 설정(unsafe=False)으로 그림을 만든다
        png = cairosvg.svg2png(bytestring=data, background_color="white")
    except Exception as e:
        raise ProcessingError("svg를 그림으로 바꾸지 못함") from e
    return image.extract_text(png)
