"""Supabase 저장소.

주의: 이 파일은 아직 실제 Supabase에서 확인하지 못했다 (작성 시점에 쓸 수 있는 Supabase가 없었다).
로컬 Supabase를 띄운 뒤 기록 하나가 queued → done이 되는지 확인하고 이 주의를 지운다.
"""

from datetime import UTC, datetime

from supabase import Client, create_client

import config

from .base import Group, Record, RecordFile

RECORD_COLUMNS = (
    "record_id, owner_id, group_id, record_type, status, title, "
    "information_content, source_url, original_context"
)
FILE_COLUMNS = "file_id, position, original_name, file_path, file_type"


class SupabaseStore:
    def __init__(self, client: Client | None = None) -> None:
        # 비밀키로 접속한다. RLS를 건너뛰므로 이 키는 서버 환경변수에만 둔다
        self.client = client or create_client(*config.supabase_credentials())

    def get_record(self, record_id: str) -> Record | None:
        rows = (
            self.client.table("information_record")
            .select(RECORD_COLUMNS)
            .eq("record_id", record_id)
            .limit(1)
            .execute()
            .data
        )
        return Record(**rows[0]) if rows else None

    def list_files(self, record_id: str) -> list[RecordFile]:
        rows = (
            self.client.table("record_file")
            .select(FILE_COLUMNS)
            .eq("record_id", record_id)
            .order("position")
            .execute()
            .data
        )
        return [RecordFile(**row) for row in rows]

    def set_status(
        self, record_id: str, status: str, error_message: str | None = None
    ) -> None:
        (
            self.client.table("information_record")
            .update({"status": status, "error_message": error_message})
            .eq("record_id", record_id)
            .neq("status", "deleting")
            .execute()
        )

    def download(self, file_path: str) -> bytes:
        return self.client.storage.from_(config.RECORDS_BUCKET).download(file_path)

    def delete_files(self, file_paths: list[str]) -> None:
        if file_paths:
            self.client.storage.from_(config.RECORDS_BUCKET).remove(file_paths)

    def list_groups(self, owner_id: str) -> list[Group]:
        rows = (
            self.client.table("record_group")
            .select("group_id, name, is_default")
            .eq("owner_id", owner_id)
            .order("created_at")
            .execute()
            .data
        )
        return [Group(**row) for row in rows]

    def set_suggested_group(self, record_id: str, group_id: str) -> None:
        (
            self.client.table("information_record")
            .update({"suggested_group_id": group_id})
            .eq("record_id", record_id)
            .neq("status", "deleting")
            .execute()
        )

    def save_analysis(
        self,
        record_id: str,
        one_line: str,
        key_points: list[str],
        context: str | None,
    ) -> None:
        self._update_record(
            record_id,
            {
                "summary": one_line,
                "summary_detail": {"one_line": one_line, "key_points": key_points},
                "analyzed_at": datetime.now(UTC).isoformat(),
                "analyzed_context": context,
                "analysis_moved_at": None,
                "analysis_status": "done",
            },
        )

    def set_analysis_status(self, record_id: str, status: str) -> None:
        self._update_record(record_id, {"analysis_status": status})

    def _update_record(self, record_id: str, values: dict) -> None:
        (
            self.client.table("information_record")
            .update(values)
            .eq("record_id", record_id)
            .neq("status", "deleting")
            .execute()
        )
