"""AI 분석: 기록 하나의 AI 정리글(핵심 1줄 + 요약 3개)을 만든다.

'AI 분석하기'·다시 분석·챗봇 요청 때만 한다. 저장할 때는 하지 않는다 (docs/spec/features/f04-process-index.md).
분석해도 되는지(다시 분석 조건, AI 활용 꺼짐 그룹)는 웹 서버가 먼저 판단하고 부른다.
"""

import json
import logging
import re

import config
import pipeline
from ai import text as ai_text
from index.base import VectorIndex
from stores.base import Record, RecordFile, RecordStore

logger = logging.getLogger(__name__)

# 메모·하이라이트는 정리하지 않는다
ANALYZABLE = {"url", "video", "file", "capture"}

PROMPT = """아래 기록을 읽고 한국어로 정리해 줘.
- one_line: 이 기록의 핵심을 한 문장으로
- key_points: 중요한 내용 3개. 각각 짧은 한 문장
- 메모는 사용자가 이 기록을 저장한 이유다. 내용과 함께 검토한다
- 특정 직군의 관점이 아니라 일반적인 관점으로 쓴다
- 기록에 없는 내용은 지어내지 않는다
- 아래 형식의 JSON만 답한다 (설명, 코드 블록 없이)

{{"one_line": "...", "key_points": ["...", "...", "..."]}}

기록:
{material}"""


class AnalysisError(Exception):
    """정리글을 만들지 못함. 메시지는 로그에만 남긴다."""


def analyze_record(record_id: str, store: RecordStore, index: VectorIndex) -> None:
    record = store.get_record(record_id)
    if (
        record is None
        or record.status == "deleting"
        or record.record_type not in ANALYZABLE
    ):
        logger.info("record %s: 분석 대상 아님", record_id)
        return

    try:
        sources = _read_sources(record, store)
        one_line, key_points = _summarize(record, sources)

        # 분석하는 동안 지워졌을 수 있어, 저장 직전에 다시 읽는다
        current = store.get_record(record_id)
        if current is None or current.status == "deleting":
            logger.info("record %s: 분석 중 삭제되어 멈춤", record_id)
            return
        # 기준 데이터(DB)를 먼저 쓰고 벡터를 그다음에 쓴다
        store.save_analysis(record_id, one_line, key_points, record.original_context)
        index.replace_summary(current, "\n".join([one_line, *key_points]))
    except Exception as e:
        # 기록 내용이 섞일 수 있어 오류 글은 남기지 않는다
        logger.warning("record %s: 분석 실패 (%s)", record_id, type(e).__name__)
        store.set_analysis_status(record_id, "failed")


def _read_sources(
    record: Record, store: RecordStore
) -> list[tuple[RecordFile | None, str]]:
    """글자를 다시 읽는다. 뽑은 글자는 저장하지 않으므로 분석할 때마다 원본에서 뽑는다."""
    if record.record_type not in pipeline.FILE_RECORD_TYPES:
        return pipeline.extract_sources(record, [], store)
    files = store.list_files(record.record_id)
    try:
        return pipeline.extract_sources(record, files, store)
    except Exception:
        # 출처 링크가 있는 파일은 가공 뒤 원본이 지워져 있다. 출처 링크에서 다시 가져온다
        if not record.source_url:
            raise
        return [(None, pipeline.fetch_url_text(record.source_url))]


def _summarize(
    record: Record, sources: list[tuple[RecordFile | None, str]]
) -> tuple[str, list[str]]:
    material = _material(record, sources)
    if len(material) > config.ANALYSIS_MAX_CHARS:
        logger.info(
            "record %s: 글자 %d자 중 앞 %d자만 분석",
            record.record_id, len(material), config.ANALYSIS_MAX_CHARS,
        )
        material = material[: config.ANALYSIS_MAX_CHARS]
    answer = ai_text.generate_text("analysis", PROMPT.format(material=material))
    return _parse(answer)


def _material(record: Record, sources: list[tuple[RecordFile | None, str]]) -> str:
    parts = [
        f"제목: {record.title}" if record.title else None,
        f"주소: {record.source_url}" if record.source_url else None,
        f"메모: {record.original_context}" if record.original_context else None,
    ]
    for file, text in sources:
        if file:
            parts.append(f"\n[파일: {file.original_name}]")
        if text:
            parts.append(text)
    return "\n".join(p for p in parts if p)


def _parse(answer: str) -> tuple[str, list[str]]:
    # shortcut: 글로 받은 JSON을 검사한다, 형식 오류가 잦으면 회사별 구조화 출력(structured outputs)으로 바꾼다
    body = re.search(r"\{.*\}", answer, re.S)
    if not body:
        raise AnalysisError("JSON이 없음")
    try:
        data = json.loads(body.group())
    except json.JSONDecodeError as e:
        raise AnalysisError("JSON 형식 오류") from e
    one_line = data.get("one_line")
    key_points = data.get("key_points")
    texts = [one_line, *key_points] if isinstance(key_points, list) else [None]
    if len(texts) != 4 or not all(isinstance(t, str) and t.strip() for t in texts):
        raise AnalysisError("핵심 1줄과 요약 3개가 아님")
    return one_line.strip(), [p.strip() for p in key_points]
