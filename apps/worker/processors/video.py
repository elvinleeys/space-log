"""영상 링크: 유튜브 자막을 글로 쓴다. 자막이 없으면 가공 실패로 둔다.

자막이 없는 영상의 소리를 글로 바꾸는 것(음성 변환)은 넣지 않았다. 배포 서버 용량 때문이다.
넣으려면 무엇이 필요한지는 이 기능을 추가한 PR 설명에 정리해 두었다.
"""

from urllib.parse import parse_qs, urlsplit

from youtube_transcript_api import CouldNotRetrieveTranscript, YouTubeTranscriptApi

import config

from . import ProcessingError


def youtube_video_id(url: str) -> str | None:
    parts = urlsplit(url)
    host = (parts.hostname or "").removeprefix("www.").removeprefix("m.")
    segments = [s for s in parts.path.split("/") if s]
    if host == "youtu.be":
        return segments[0] if segments else None
    if host in ("youtube.com", "youtube-nocookie.com"):
        if parts.path == "/watch":
            return parse_qs(parts.query).get("v", [None])[0]
        if len(segments) >= 2 and segments[0] in ("shorts", "embed", "live"):
            return segments[1]
    return None


def fetch_transcript(url: str) -> str:
    video_id = youtube_video_id(url)
    if video_id is None:
        # 수집앱(apps/desktop의 VIDEO_HOSTS)도 유튜브만 영상 링크로 분류한다
        raise ProcessingError("유튜브 영상만 자막을 가져올 수 있음")
    api = YouTubeTranscriptApi()
    try:
        try:
            transcript = api.fetch(video_id, languages=config.TRANSCRIPT_LANGUAGES)
        except CouldNotRetrieveTranscript:
            # 한국어·영어 자막이 없으면 있는 자막 중 첫 번째를 쓴다
            transcript = next(iter(api.list(video_id))).fetch()
    except (CouldNotRetrieveTranscript, StopIteration) as e:
        raise ProcessingError("영상의 자막을 찾지 못함") from e
    return "\n".join(snippet.text for snippet in transcript).strip()
