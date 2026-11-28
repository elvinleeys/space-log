import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import pipeline
from ai import text as ai_text
from analysis import analyze_record
from main import app, get_index, get_store
from stores.base import Record, RecordFile
from stores.memory import MemoryStore

FIXTURES = Path(__file__).parent / "fixtures"
RECORD_ID = "3f2b8c1e-5d47-4a9b-8e6f-1c2d3e4f5a6b"
GOOD = json.dumps(
    {"one_line": "핵심 한 줄", "key_points": ["요약 1", "요약 2", "요약 3"]},
    ensure_ascii=False,
)


class RecordingIndex:
    def __init__(self):
        self.summaries: dict[str, str] = {}

    def replace_chunks(self, record, chunks):
        pass

    def replace_summary(self, record, text):
        self.summaries[record.record_id] = text


def record(**over) -> Record:
    base = dict(
        record_id="r1", owner_id="u1", group_id="g1", record_type="file",
        status="done", original_context="회의 준비용",
    )
    return Record(**{**base, **over})


def txt(n=1) -> tuple[RecordFile, bytes]:
    f = RecordFile(f"f{n}", n, "sample.txt", f"u1/r1/f{n}.txt", "txt")
    return f, (FIXTURES / "sample.txt").read_bytes()


@pytest.fixture
def store(monkeypatch):
    monkeypatch.setenv("AI_API_KEY", "test-key")
    return MemoryStore()


@pytest.fixture
def index():
    return RecordingIndex()


def answer(monkeypatch, text):
    prompts = []

    def fake(task, prompt):
        prompts.append((task, prompt))
        return text

    monkeypatch.setattr(ai_text, "generate_text", fake)
    return prompts


def test_파일과_메모를_함께_보내고_정리글을_저장한다(store, index, monkeypatch):
    prompts = answer(monkeypatch, GOOD)
    store.add(record(), [txt()])
    analyze_record("r1", store, index)
    assert store.analysis_status["r1"] == "done"
    assert store.analyses["r1"] == {
        "summary": "핵심 한 줄",
        "summary_detail": {
            "one_line": "핵심 한 줄",
            "key_points": ["요약 1", "요약 2", "요약 3"],
        },
        "analyzed_context": "회의 준비용",
    }
    assert index.summaries["r1"] == "핵심 한 줄\n요약 1\n요약 2\n요약 3"
    task, prompt = prompts[0]
    assert task == "analysis"
    assert "두 번째 문단" in prompt and "메모: 회의 준비용" in prompt
    assert "sample.txt" in prompt


def test_코드_블록에_싸인_답도_읽는다(store, index, monkeypatch):
    answer(monkeypatch, f"```json\n{GOOD}\n```")
    store.add(record(), [txt()])
    analyze_record("r1", store, index)
    assert store.analysis_status["r1"] == "done"


@pytest.mark.parametrize(
    "text",
    [
        "",
        "정리하지 못했어요",
        "{깨진 JSON",
        json.dumps({"one_line": "한 줄", "key_points": ["하나", "둘"]}),
        json.dumps({"one_line": "", "key_points": ["하나", "둘", "셋"]}),
        json.dumps({"one_line": "한 줄", "key_points": "하나"}),
    ],
)
def test_답이_없거나_형식이_다르면_failed다(store, index, monkeypatch, text):
    answer(monkeypatch, text)
    store.add(record(), [txt()])
    analyze_record("r1", store, index)
    assert store.analysis_status["r1"] == "failed"
    assert store.analyses == {} and index.summaries == {}


def test_메모와_하이라이트와_삭제_중인_기록은_건드리지_않는다(store, index, monkeypatch):
    prompts = answer(monkeypatch, GOOD)
    store.add(record(record_id="memo", record_type="memo", information_content="메모"))
    store.add(record(record_id="hl", record_type="highlight", information_content="글"))
    store.add(record(record_id="del", status="deleting"), [txt()])
    for record_id in ("memo", "hl", "del", "없는-기록"):
        analyze_record(record_id, store, index)
    assert prompts == [] and store.analysis_status == {}


def test_분석하는_동안_지워진_기록에는_저장하지_않는다(store, index, monkeypatch):
    def delete_while_analyzing(task, prompt):
        store.records["r1"].status = "deleting"
        return GOOD

    monkeypatch.setattr(ai_text, "generate_text", delete_while_analyzing)
    store.add(record(), [txt()])
    analyze_record("r1", store, index)
    assert store.analyses == {} and index.summaries == {}


def test_링크_기록은_원문을_다시_가져와_분석한다(store, index, monkeypatch):
    prompts = answer(monkeypatch, GOOD)
    monkeypatch.setattr(pipeline, "fetch_url_text", lambda url: "기사 본문")
    store.add(record(record_type="url", source_url="https://example.com/a"))
    analyze_record("r1", store, index)
    assert store.analysis_status["r1"] == "done" and "기사 본문" in prompts[0][1]


def test_원본이_지워진_출처_링크_파일은_출처에서_다시_가져온다(store, index, monkeypatch):
    prompts = answer(monkeypatch, GOOD)
    monkeypatch.setattr(pipeline, "fetch_url_text", lambda url: "출처 본문")
    f, _ = txt()
    store.add(record(source_url="https://example.com/a"), [(f, b"")])
    store.blobs.clear()  # 가공 뒤 원본이 지워진 상태
    analyze_record("r1", store, index)
    assert store.analysis_status["r1"] == "done" and "출처 본문" in prompts[0][1]


def test_원본도_출처도_없으면_failed다(store, index, monkeypatch):
    answer(monkeypatch, GOOD)
    f, _ = txt()
    store.add(record(), [(f, b"")])
    store.blobs.clear()
    analyze_record("r1", store, index)
    assert store.analysis_status["r1"] == "failed"


def test_긴_글은_상한까지만_보낸다(store, index, monkeypatch):
    prompts = answer(monkeypatch, GOOD)
    monkeypatch.setattr(pipeline, "fetch_url_text", lambda url: "가" * 100_000)
    store.add(record(record_type="url", source_url="https://example.com/a"))
    analyze_record("r1", store, index)
    assert prompts[0][1].count("가") < 60_001


# ── API ──────────────────────────────────────────────


@pytest.fixture
def api(store, index, monkeypatch):
    monkeypatch.setenv("WORKER_SECRET", "test-secret")
    app.dependency_overrides[get_store] = lambda: store
    app.dependency_overrides[get_index] = lambda: index
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_analyze는_비밀값이_다르면_401(api):
    body = {"record_id": RECORD_ID}
    assert api.post("/analyze", json=body).status_code == 401
    wrong = {"X-Worker-Secret": "wrong"}
    assert api.post("/analyze", json=body, headers=wrong).status_code == 401


def test_analyze는_202로_받고_뒤에서_분석한다(api, store, monkeypatch):
    answer(monkeypatch, GOOD)
    f = RecordFile("f1", 1, "sample.txt", "u1/r1/f1.txt", "txt")
    store.add(
        record(record_id=RECORD_ID), [(f, (FIXTURES / "sample.txt").read_bytes())]
    )
    response = api.post(
        "/analyze",
        json={"record_id": RECORD_ID},
        headers={"X-Worker-Secret": "test-secret"},
    )
    assert response.status_code == 202
    assert response.json() == {"record_id": RECORD_ID, "accepted": True}
    assert store.analysis_status[RECORD_ID] == "done"
