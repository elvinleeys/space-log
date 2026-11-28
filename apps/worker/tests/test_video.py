import pytest

from processors import ProcessingError
from processors.video import fetch_transcript, youtube_video_id


@pytest.mark.parametrize(
    "url",
    [
        "https://www.youtube.com/watch?v=abc123XYZ_-",
        "https://youtu.be/abc123XYZ_-?t=10",
        "https://m.youtube.com/watch?v=abc123XYZ_-&list=x",
        "https://www.youtube.com/shorts/abc123XYZ_-",
        "https://www.youtube.com/embed/abc123XYZ_-",
    ],
)
def test_유튜브_주소에서_영상_식별값을_찾는다(url):
    assert youtube_video_id(url) == "abc123XYZ_-"


def test_유튜브가_아니면_식별값이_없다():
    assert youtube_video_id("https://vimeo.com/123") is None
    assert youtube_video_id("https://www.youtube.com/@channel") is None


def test_유튜브가_아닌_영상은_가공_실패다():
    with pytest.raises(ProcessingError):
        fetch_transcript("https://vimeo.com/123")
