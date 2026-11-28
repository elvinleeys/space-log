"""가짜 저장소. 테스트와, Supabase 없이 서버만 띄워 볼 때 쓴다."""

from dataclasses import replace

from .base import Group, Record, RecordFile


class MemoryStore:
    def __init__(self) -> None:
        self.records: dict[str, Record] = {}
        self.files: dict[str, list[RecordFile]] = {}
        self.blobs: dict[str, bytes] = {}
        self.errors: dict[str, str | None] = {}
        # 확인용: 기록마다 거쳐 간 status
        self.history: dict[str, list[str]] = {}
        # 사용자마다 그룹 목록, 기록마다 AI 추천 그룹
        self.groups: dict[str, list[Group]] = {}
        self.suggested: dict[str, str] = {}

    def add(
        self,
        record: Record,
        files: list[tuple[RecordFile, bytes]] | None = None,
    ) -> None:
        self.records[record.record_id] = record
        self.files[record.record_id] = [f for f, _ in files or []]
        for f, data in files or []:
            self.blobs[f.file_path] = data

    def get_record(self, record_id: str) -> Record | None:
        record = self.records.get(record_id)
        return replace(record) if record else None

    def list_files(self, record_id: str) -> list[RecordFile]:
        return sorted(self.files.get(record_id, []), key=lambda f: f.position)

    def set_status(
        self, record_id: str, status: str, error_message: str | None = None
    ) -> None:
        record = self.records.get(record_id)
        if record is None or record.status == "deleting":
            return
        record.status = status
        self.errors[record_id] = error_message
        self.history.setdefault(record_id, []).append(status)

    def download(self, file_path: str) -> bytes:
        return self.blobs[file_path]

    def delete_files(self, file_paths: list[str]) -> None:
        for path in file_paths:
            self.blobs.pop(path, None)

    def list_groups(self, owner_id: str) -> list[Group]:
        return list(self.groups.get(owner_id, []))

    def set_suggested_group(self, record_id: str, group_id: str) -> None:
        record = self.records.get(record_id)
        if record is None or record.status == "deleting":
            return
        self.suggested[record_id] = group_id
