"""HTML: 태그를 걷어 내고 글자만 남긴다. 주소에서 가져온 원문과 svg(svg.py)에도 쓴다."""

import re
import warnings

from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning


# 화면에 보이지 않는 내용
HIDDEN_TAGS = ["script", "style", "noscript", "template"]


def extract_text(data: bytes | str) -> str:
    # svg(XML)도 일부러 HTML 파서로 읽는다. 글자만 필요하고, 외부 엔티티를 풀지 않아 안전하다
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", XMLParsedAsHTMLWarning)
        soup = BeautifulSoup(data, "html.parser")
    for tag in soup(HIDDEN_TAGS):
        tag.decompose()
    lines = (line.strip() for line in soup.get_text("\n").splitlines())
    text = "\n".join(lines)
    return re.sub(r"\n{3,}", "\n\n", text).strip()
