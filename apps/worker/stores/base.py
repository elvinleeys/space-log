"""기록과 파일을 읽고 쓰는 곳의 약속. 가공 순서(pipeline)는 이 인터페이스만 안다."""

from dataclasses import dataclass
from typing import Protocol


@dataclass
class Record:
    record_id: str
    owner_id: str
    group_id: str
    record_type: str
    status: str
    title: str | None = None
    information_content: str | None = None
    source_url: str | None = None
    original_context: str | None = None


@dataclass
class RecordFile:
    file_id: str
    position: int
    original_name: str
    file_path: str
    file_type: str


class RecordStore(Protocol):
    def get_record(self, record_id: str) -> Record | None: ...

    def list_files(self, record_id: str) -> list[RecordFile]:
        """넣은 순서(position)대로 돌려준다."""
        ...

    def set_status(
        self, record_id: str, status: str, error_message: str | None = None
    ) -> None:
        """deleting인 기록은 바꾸지 않는다 (가공 중에 지운 기록을 되살리지 않게)."""
        ...

    def download(self, file_path: str) -> bytes: ...

    def delete_files(self, file_paths: list[str]) -> None: ...
