"""가공 서버. 경로만 둔다. 가공 순서는 pipeline.py, 형식별 추출은 processors/ 에 있다."""

import hmac
import logging
from functools import lru_cache

from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException

import config
from index.base import VectorIndex
from index.null import NullIndex
from pipeline import process_record
from schemas import Health, ProcessAccepted, ProcessRequest
from stores.base import RecordStore

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Spacelog 가공 서버")


@lru_cache
def get_store() -> RecordStore:
    if config.store_kind() == "memory":
        from stores.memory import MemoryStore

        return MemoryStore()
    from stores.supabase import SupabaseStore

    return SupabaseStore()


@lru_cache
def get_index() -> VectorIndex:
    # Qdrant 구현이 생기면 여기서 고른다
    return NullIndex()


def require_secret(x_worker_secret: str | None = Header(default=None)) -> None:
    secret = config.worker_secret()
    # 비밀값을 설정하지 않은 서버는 모든 요청을 거부한다 (열어 두지 않는다)
    if not secret or not hmac.compare_digest(
        secret.encode(), (x_worker_secret or "").encode()
    ):
        raise HTTPException(status_code=401, detail="X-Worker-Secret이 맞지 않음")


@app.get("/health")
def health() -> Health:
    return Health()


@app.post("/process", status_code=202, dependencies=[Depends(require_secret)])
def request_process(
    body: ProcessRequest,
    background: BackgroundTasks,
    store: RecordStore = Depends(get_store),
    index: VectorIndex = Depends(get_index),
) -> ProcessAccepted:
    """가공(글자 추출 + 원문 조각)을 맡긴다. 바로 응답하고 가공은 뒤에서 한다."""
    background.add_task(process_record, str(body.record_id), store, index)
    return ProcessAccepted(record_id=body.record_id)
