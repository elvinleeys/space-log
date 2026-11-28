"""자동 가공 순서: 글자 추출 → 원문 조각 → 벡터 저장 자리 → 상태 변경 → 그룹 추천.

일반 def로 둔다. OCR·PDF 추출이 오래 걸려 async def 안에서 돌리면 서버 전체가 멈춘다.
실행 방식(BackgroundTasks, 대기열 등)은 이 함수를 부르는 쪽에서 정한다.
"""

import logging

from chunking import split_chunks
from index.base import Chunk, VectorIndex
from processors import ProcessingError, extract_file_text
from processors.url import FetchError, fetch_url_text
from processors.video import fetch_transcript
from recommend import recommend_group
from stores.base import Record, RecordFile, RecordStore

logger = logging.getLogger(__name__)

# 가공을 시작해도 되는 상태. processing은 처리 중에 서버가 꺼져 남은 기록, failed는 다시 시도
PROCESSABLE = {"queued", "processing", "failed"}
FILE_RECORD_TYPES = {"file", "capture"}


def process_record(record_id: str, store: RecordStore, index: VectorIndex) -> None:
    record = store.get_record(record_id)
    if record is None or record.status not in PROCESSABLE:
        logger.info("record %s: 가공 대상 아님 (%s)", record_id, record and record.status)
        return

    store.set_status(record_id, "processing")
    try:
        files = (
            store.list_files(record_id)
            if record.record_type in FILE_RECORD_TYPES
            else []
        )
        sources = extract_sources(record, files, store)
        chunks = _to_chunks(record, sources)

        # 가공하는 동안 지워졌거나 그룹이 바뀌었을 수 있어, 저장 직전에 다시 읽는다
        current = store.get_record(record_id)
        if current is None or current.status == "deleting":
            logger.info("record %s: 가공 중 삭제되어 멈춤", record_id)
            return
        index.replace_chunks(current, chunks)
        store.set_status(record_id, "done")
    except ProcessingError as e:
        store.set_status(record_id, "failed", str(e))
        return
    except Exception:
        logger.exception("record %s: 가공 실패", record_id)
        store.set_status(record_id, "failed", "가공 중 오류가 발생함")
        return

    # 출처 링크가 있는 파일은 원본을 지우고 출처 링크로 본다. 실패한 기록은 여기까지 오지 않는다
    if current.source_url and files:
        try:
            store.delete_files([f.file_path for f in files])
        except Exception:
            logger.exception("record %s: 원본 삭제 실패 (기록은 done)", record_id)

    # 추천은 덧붙이는 일이다. 실패해도 기록은 done으로 둔다
    try:
        recommend_group(current, sources, store)
    except Exception:
        logger.exception("record %s: 그룹 추천 실패 (기록은 done)", record_id)


Source = tuple[RecordFile | None, str]


def extract_sources(
    record: Record, files: list[RecordFile], store: RecordStore
) -> list[Source]:
    """(파일, 뽑은 글자) 묶음을 만든다. 파일 없는 기록은 파일 자리가 None인 묶음 하나."""
    kind = record.record_type
    if kind in FILE_RECORD_TYPES:
        sources = [
            (f, extract_file_text(f.file_type, store.download(f.file_path)))
            for f in files
        ]
    elif kind == "url":
        try:
            sources = [(None, fetch_url_text(record.source_url or ""))]
        except FetchError as e:
            # 못 읽는 링크는 실패로 두지 않고 제목·주소·메모로 가공을 끝낸다
            logger.info("record %s: 원문 없음 (%s)", record.record_id, e)
            sources = [(None, "")]
    elif kind == "video":
        sources = [(None, fetch_transcript(record.source_url or ""))]
    else:  # memo, highlight
        sources = [(None, record.information_content or "")]
    return sources


def _to_chunks(record: Record, sources: list[Source]) -> list[Chunk]:
    chunks: list[Chunk] = []
    for file, text in sources:
        # 글자가 없으면(글자 없는 사진, 못 읽는 링크) 제목·파일 이름·주소·메모를 재료로 쓴다
        texts = split_chunks(text) or split_chunks(_fallback_text(record, file))
        chunks += [
            Chunk(file_id=file.file_id if file else None, chunk_index=i, text=t)
            for i, t in enumerate(texts)
        ]
    return chunks


def _fallback_text(record: Record, file: RecordFile | None) -> str:
    parts = [
        record.title,
        file.original_name if file else None,
        record.source_url,
        record.original_context,
    ]
    return "\n".join(p for p in parts if p)
