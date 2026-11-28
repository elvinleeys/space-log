import pytest

import pipeline
import recommend
from ai import text as ai_text
from pipeline import process_record
from stores.base import Group, Record
from stores.memory import MemoryStore
from index.null import NullIndex

GROUPS = [
    Group("g0", "분류 안 된 기록", is_default=True),
    Group("g1", "회의록"),
    Group("g2", "디자인 레퍼런스"),
]


def record(**over) -> Record:
    base = dict(
        record_id="r1", owner_id="u1", group_id="g0", record_type="memo",
        status="queued", information_content="주간 회의에서 정한 일정",
        original_context="다음 주 회의 준비",
    )
    return Record(**{**base, **over})


@pytest.fixture
def store(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "test-key")
    store = MemoryStore()
    store.groups["u1"] = list(GROUPS)
    return store


def answer(monkeypatch, text):
    """AI 답을 정해 두고, 받은 요청을 기억한다."""
    prompts = []

    def fake(task, prompt):
        prompts.append((task, prompt))
        if isinstance(text, Exception):
            raise text
        return text

    monkeypatch.setattr(ai_text, "generate_text", fake)
    return prompts


def test_분류_안_된_기록은_가공_뒤에_추천_그룹을_남긴다(store, monkeypatch):
    prompts = answer(monkeypatch, "1")
    store.add(record())
    process_record("r1", store, NullIndex())
    assert store.records["r1"].status == "done"
    assert store.suggested == {"r1": "g1"}
    # 그룹은 옮기지 않는다
    assert store.records["r1"].group_id == "g0"
    task, prompt = prompts[0]
    assert task == "recommend"
    assert "1. 회의록" in prompt and "2. 디자인 레퍼런스" in prompt
    assert "분류 안 된 기록" not in prompt
    assert "주간 회의에서 정한 일정" in prompt and "다음 주 회의 준비" in prompt


def test_이미_그룹이_있는_기록은_추천하지_않는다(store, monkeypatch):
    prompts = answer(monkeypatch, "1")
    store.add(record(group_id="g2"))
    process_record("r1", store, NullIndex())
    assert prompts == [] and store.suggested == {}


def test_고를_그룹이_없으면_AI를_부르지_않는다(store, monkeypatch):
    prompts = answer(monkeypatch, "1")
    store.groups["u1"] = [GROUPS[0]]
    store.add(record())
    process_record("r1", store, NullIndex())
    assert prompts == [] and store.suggested == {}


@pytest.mark.parametrize("text", ["0", "", "9", "잘 모르겠어요"])
def test_없음이나_엉뚱한_답이면_추천을_남기지_않는다(store, monkeypatch, text):
    answer(monkeypatch, text)
    store.add(record())
    process_record("r1", store, NullIndex())
    assert store.suggested == {} and store.records["r1"].status == "done"


def test_추천이_실패해도_기록은_done이다(store, monkeypatch):
    answer(monkeypatch, RuntimeError("AI 오류"))
    store.add(record())
    process_record("r1", store, NullIndex())
    assert store.suggested == {} and store.records["r1"].status == "done"


def test_키가_없으면_그룹도_읽지_않고_AI도_부르지_않는다(store, monkeypatch):
    monkeypatch.delenv("AI_API_KEY")
    prompts = answer(monkeypatch, "1")
    monkeypatch.setattr(store, "list_groups", lambda owner_id: pytest.fail("읽으면 안 된다"))
    store.add(record())
    process_record("r1", store, NullIndex())
    assert prompts == [] and store.suggested == {}


def test_AI에_보내는_글자_수를_넘기지_않는다(store, monkeypatch):
    prompts = answer(monkeypatch, "2")
    monkeypatch.setattr(pipeline, "fetch_url_text", lambda url: "가" * 50_000)
    store.add(record(record_type="url", source_url="https://example.com/a"))
    process_record("r1", store, NullIndex())
    assert store.suggested == {"r1": "g2"}
    assert prompts[0][1].count("가") < recommend.config.RECOMMEND_MAX_CHARS
