"""가공 후 그룹 추천: '분류 안 된 기록'에 있는 기록에 어울리는 기존 그룹 하나를 골라 남긴다.

그룹을 옮기지 않고 새 그룹도 만들지 않는다. 사용자가 웹의 빠른 분류 카드에서 수락한다
(docs/spec/features/f03-group-recommend.md).
"""

import re

import config
from ai import text as ai_text
from stores.base import Record, RecordFile, RecordStore

PROMPT = """아래 기록을 넣기에 가장 어울리는 그룹 하나를 골라 줘.
- 목록에 있는 그룹 중에서만 고른다
- 어울리는 그룹이 없으면 0
- 번호 하나만 답한다 (설명 없이 숫자만)

그룹 목록:
{groups}

기록:
{material}"""


def recommend_group(
    record: Record, sources: list[tuple[RecordFile | None, str]], store: RecordStore
) -> str | None:
    """추천한 그룹 id. 추천하지 않았으면 None."""
    if not ai_text.is_active():
        return None
    groups = store.list_groups(record.owner_id)
    current = next((g for g in groups if g.group_id == record.group_id), None)
    if current is None or not current.is_default:
        return None
    candidates = [g for g in groups if not g.is_default]
    if not candidates:
        return None

    prompt = PROMPT.format(
        groups="\n".join(f"{i}. {g.name}" for i, g in enumerate(candidates, 1)),
        material=_material(record, sources),
    )
    number = re.search(r"\d+", ai_text.generate_text("recommend", prompt))
    choice = int(number.group()) if number else 0
    if not 1 <= choice <= len(candidates):
        return None
    group_id = candidates[choice - 1].group_id
    store.set_suggested_group(record.record_id, group_id)
    return group_id


def _material(record: Record, sources: list[tuple[RecordFile | None, str]]) -> str:
    parts = [
        f"제목: {record.title}" if record.title else None,
        f"주소: {record.source_url}" if record.source_url else None,
        f"메모: {record.original_context}" if record.original_context else None,
    ]
    for file, text in sources:
        if file:
            parts.append(f"파일 이름: {file.original_name}")
        if text:
            parts.append(text)
    # 고르는 데는 앞부분이면 충분하다. 넘는 부분은 보내지 않는다
    return "\n".join(p for p in parts if p)[: config.RECOMMEND_MAX_CHARS]
