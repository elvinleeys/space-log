"""아무것도 저장하지 않는 자리 표시. Qdrant 연결 전까지 쓴다."""

import logging

from stores.base import Record

from .base import Chunk

logger = logging.getLogger(__name__)


class NullIndex:
    def replace_chunks(self, record: Record, chunks: list[Chunk]) -> None:
        # 원문은 로그에 남기지 않는다. 개수만 남긴다
        logger.info("record %s: 원문 조각 %d개 (저장 안 함)", record.record_id, len(chunks))

    def replace_summary(self, record: Record, text: str) -> None:
        logger.info("record %s: 요약본 벡터 (저장 안 함)", record.record_id)
