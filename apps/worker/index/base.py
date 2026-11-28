"""벡터 저장의 약속. Qdrant 구현은 이 폴더에 파일 하나를 더하고 main.py의 get_index에서 고른다."""

from dataclasses import dataclass
from typing import Protocol

from stores.base import Record


@dataclass
class Chunk:
    # 파일 없는 기록(메모, 하이라이트, URL, 영상)은 None
    file_id: str | None
    # 그 파일(또는 기록) 안에서의 조각 순서. 0부터
    chunk_index: int
    text: str


class VectorIndex(Protocol):
    def replace_chunks(self, record: Record, chunks: list[Chunk]) -> None:
        """그 기록의 기존 원문 조각 벡터를 지우고 새로 저장한다.

        payload에 넣을 user_id(record.owner_id), record_id, group_id는 record에 있다.
        record는 저장 직전에 DB에서 다시 읽은 값이다. 조각의 글(text)은 payload에 넣지 않는다.
        """
        ...

    def replace_summary(self, record: Record, text: str) -> None:
        """그 기록의 기존 요약본 벡터를 지우고 새로 저장한다 (기록마다 1개, vector_kind는 summary).

        text는 핵심 1줄 + 요약 3개를 합친 글이다. payload 규칙은 replace_chunks와 같다.
        """
        ...
