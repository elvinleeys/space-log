"""웹 서버(apps/web)와의 약속. 바꾸면 apps/web/src/lib/worker.ts도 같은 PR에서 고친다."""

from uuid import UUID

from pydantic import BaseModel


class ProcessRequest(BaseModel):
    record_id: UUID


class ProcessAccepted(BaseModel):
    record_id: UUID
    accepted: bool = True


class Health(BaseModel):
    ok: bool = True
