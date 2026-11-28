import httpx
import pytest

import config
from processors import url as url_module
from processors.url import FetchError, check_public_url, fetch_url_text


@pytest.fixture(autouse=True)
def fake_dns(monkeypatch):
    """실제 DNS를 쓰지 않는다. 이름에 따라 공개 주소나 사설 주소를 돌려준다."""
    table = {"example.com": "93.184.216.34", "inner.example.com": "10.0.0.5"}
    monkeypatch.setattr(url_module, "_resolve", lambda host: [table.get(host, host)])


def transport(handler):
    return httpx.MockTransport(handler)


def test_html_원문에서_글자를_뽑는다():
    page = "<html><body><h1>글 제목</h1><script>x</script><p>본문</p></body></html>"
    t = transport(lambda r: httpx.Response(200, html=page))
    assert fetch_url_text("https://example.com/a", t) == "글 제목\n본문"


@pytest.mark.parametrize(
    "bad",
    [
        "http://127.0.0.1/admin",
        "http://localhost:8000/",
        "http://10.0.0.5/",
        "http://169.254.169.254/latest/meta-data",
        "http://[::1]/",
        "http://inner.example.com/",
        "file:///etc/passwd",
        "ftp://example.com/a",
        "not a url",
    ],
)
def test_내부_주소와_http가_아닌_주소는_거부한다(bad, monkeypatch):
    monkeypatch.setattr(
        url_module,
        "_resolve",
        lambda host: ["127.0.0.1"] if host == "localhost" else ["10.0.0.5"] if host.startswith("inner") else [host],
    )
    with pytest.raises(FetchError):
        check_public_url(bad)


def test_리다이렉트로_내부_주소에_가는_것도_막는다():
    def handler(request):
        if request.url.host == "example.com":
            return httpx.Response(302, headers={"location": "http://10.0.0.5/secret"})
        return httpx.Response(200, html="<p>내부 정보</p>")

    with pytest.raises(FetchError):
        fetch_url_text("https://example.com/a", transport(handler))


def test_오류_응답과_글이_아닌_응답은_가져오지_못한_것으로_본다():
    with pytest.raises(FetchError):
        fetch_url_text("https://example.com/a", transport(lambda r: httpx.Response(403)))
    image = transport(lambda r: httpx.Response(200, content=b"x", headers={"content-type": "image/png"}))
    with pytest.raises(FetchError):
        fetch_url_text("https://example.com/a.png", image)


def test_너무_큰_원문은_가져오지_않는다(monkeypatch):
    monkeypatch.setattr(config, "FETCH_MAX_BYTES", 10)
    big = transport(lambda r: httpx.Response(200, html="<p>" + "가" * 100 + "</p>"))
    with pytest.raises(FetchError):
        fetch_url_text("https://example.com/a", big)


def test_연결_실패는_가져오지_못한_것으로_본다():
    def handler(request):
        raise httpx.ConnectError("끊김")

    with pytest.raises(FetchError):
        fetch_url_text("https://example.com/a", transport(handler))
