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


@dataclass
class Group:
    group_id: str
    name: str
    # '분류 안 된 기록'이면 참
    is_default: bool = False


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

    def list_groups(self, owner_id: str) -> list[Group]:
        """그 사용자의 그룹 전부 ('분류 안 된 기록' 포함)."""
        ...

    def set_suggested_group(self, record_id: str, group_id: str) -> None:
        """AI가 추천한 그룹을 남긴다. 기록의 그룹(group_id)은 바꾸지 않는다."""
        ...

    def save_analysis(
        self,
        record_id: str,
        one_line: str,
        key_points: list[str],
        context: str | None,
    ) -> None:
        """AI 정리글을 저장하고 analysis_status를 done으로 바꾼다. deleting인 기록은 바꾸지 않는다.

        summary(핵심 1줄), summary_detail, analyzed_at(지금), analyzed_context(분석 때 메모)를 쓰고
        analysis_moved_at을 비운다.
        """
        ...

    def set_analysis_status(self, record_id: str, status: str) -> None:
        """deleting인 기록은 바꾸지 않는다."""
        ...
