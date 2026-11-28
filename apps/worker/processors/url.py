"""주소에서 원문을 가져와 글자를 뽑는다.

사용자가 넣은 주소를 서버가 대신 여는 것이라, 서버 안쪽 망(사설·루프백 주소)으로는 나가지 않게 막는다.
"""

import ipaddress
import socket
from urllib.parse import urljoin, urlsplit

import httpx

import config

from . import html


class FetchError(Exception):
    """원문을 가져오지 못함. 가공은 제목·주소·메모로 이어 간다."""


def _resolve(host: str) -> list[str]:
    return [info[4][0] for info in socket.getaddrinfo(host, None)]


def check_public_url(url: str) -> None:
    parts = urlsplit(url)
    if parts.scheme not in ("http", "https") or not parts.hostname:
        raise FetchError("http, https 주소만 가져올 수 있음")
    try:
        addresses = _resolve(parts.hostname)
    except OSError as e:
        raise FetchError("주소를 찾지 못함") from e
    # shortcut: 여기서 검사한 뒤 httpx가 주소를 다시 찾는다 (그 사이 바뀌는 DNS 재바인딩은 못 막음).
    # 막아야 하면 검사한 IP로 직접 연결하도록 바꾼다
    if not addresses or not all(ipaddress.ip_address(a).is_global for a in addresses):
        raise FetchError("내부 주소는 가져오지 않음")


def fetch_url_text(url: str, transport: httpx.BaseTransport | None = None) -> str:
    """transport는 테스트에서 가짜 응답을 넣는 자리다."""
    try:
        with httpx.Client(
            transport=transport,
            timeout=config.FETCH_TIMEOUT_SECONDS,
            follow_redirects=False,
            headers={"User-Agent": "Mozilla/5.0 (compatible; SpacelogWorker)"},
        ) as client:
            for _ in range(config.FETCH_MAX_REDIRECTS + 1):
                check_public_url(url)  # 리다이렉트로 옮겨 간 주소도 매번 검사한다
                with client.stream("GET", url) as response:
                    if response.is_redirect and "location" in response.headers:
                        url = urljoin(url, response.headers["location"])
                        continue
                    if response.status_code >= 400:
                        raise FetchError(f"원문 응답 {response.status_code}")
                    kind = response.headers.get("content-type", "")
                    if "html" not in kind and "text" not in kind:
                        raise FetchError("글로 된 페이지가 아님")
                    body = bytearray()
                    for part in response.iter_bytes():
                        body += part
                        if len(body) > config.FETCH_MAX_BYTES:
                            raise FetchError("원문이 너무 큼")
                    return html.extract_text(bytes(body))
            raise FetchError("리다이렉트가 너무 많음")
    except httpx.HTTPError as e:
        raise FetchError("원문을 가져오지 못함") from e
