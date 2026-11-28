from pathlib import Path

import pytest

import pipeline
from index.base import Chunk
from pipeline import process_record
from processors import ProcessingError
from processors.url import FetchError
from stores.base import Record, RecordFile
from stores.memory import MemoryStore

FIXTURES = Path(__file__).parent / "fixtures"


class RecordingIndex:
    """받은 조각을 기억하는 가짜 벡터 저장. 실제처럼 기존 조각을 지우고 새로 넣는다."""

    def __init__(self):
        self.saved: dict[str, list[Chunk]] = {}
        self.group_ids: dict[str, str] = {}

    def replace_chunks(self, record, chunks):
        self.saved[record.record_id] = chunks
        self.group_ids[record.record_id] = record.group_id


def record(**over) -> Record:
    base = dict(
        record_id="r1", owner_id="u1", group_id="g1", record_type="memo",
        status="queued", information_content="메모 본문",
    )
    return Record(**{**base, **over})


def file(n: int, name: str, kind: str) -> tuple[RecordFile, bytes]:
    f = RecordFile(f"f{n}", n, name, f"u1/r1/f{n}.{kind}", kind)
    return f, (FIXTURES / name).read_bytes()


@pytest.fixture
def store():
    return MemoryStore()


@pytest.fixture
def index():
    return RecordingIndex()


def test_메모_기록은_queued에서_processing을_거쳐_done이_된다(store, index):
    store.add(record())
    process_record("r1", store, index)
    assert store.history["r1"] == ["processing", "done"]
    assert [c.text for c in index.saved["r1"]] == ["메모 본문"]
    assert index.saved["r1"][0].file_id is None


def test_없는_기록과_가공_대상이_아닌_상태는_건드리지_않는다(store, index):
    process_record("없는-기록", store, index)
    for status in ("uploading", "deleting", "done"):
        store.add(record(record_id=status, status=status))
        process_record(status, store, index)
        assert store.records[status].status == status
    assert index.saved == {} and store.history == {}


def test_실패한_기록과_processing에_남은_기록은_다시_처리한다(store, index):
    for status in ("failed", "processing"):
        store.add(record(record_id=status, status=status))
        process_record(status, store, index)
        assert store.records[status].status == "done"


def test_파일이_여러_개면_파일마다_조각을_만든다(store, index):
    store.add(
        record(record_type="file", information_content=None),
        [file(1, "sample.txt", "txt"), file(2, "sample.pdf", "pdf")],
    )
    process_record("r1", store, index)
    chunks = index.saved["r1"]
    assert [(c.file_id, c.chunk_index) for c in chunks] == [("f1", 0), ("f2", 0)]
    assert "두 번째 문단" in chunks[0].text and "Hello Spacelog PDF" in chunks[1].text
    assert store.records["r1"].status == "done"


def test_출처_링크가_있는_파일은_done_뒤에_원본을_지운다(store, index):
    store.add(
        record(record_type="file", source_url="https://example.com/a"),
        [file(1, "sample.txt", "txt")],
    )
    process_record("r1", store, index)
    assert store.records["r1"].status == "done" and store.blobs == {}


def test_출처_링크가_없는_파일은_원본을_남긴다(store, index):
    store.add(record(record_type="capture"), [file(1, "sample.txt", "txt")])
    process_record("r1", store, index)
    assert store.records["r1"].status == "done" and "u1/r1/f1.txt" in store.blobs


def test_가공에_실패하면_failed와_이유를_남기고_원본은_지우지_않는다(store, index):
    broken = RecordFile("f1", 1, "깨진.pdf", "u1/r1/f1.pdf", "pdf")
    store.add(
        record(record_type="file", source_url="https://example.com/a"),
        [(broken, b"not a pdf")],
    )
    process_record("r1", store, index)
    assert store.records["r1"].status == "failed"
    assert store.errors["r1"] == "PDF를 읽지 못함"
    assert "u1/r1/f1.pdf" in store.blobs and index.saved == {}


def test_예상하지_못한_오류도_failed로_남긴다(store, index, monkeypatch):
    def boom(*_):
        raise RuntimeError("내부 오류 상세")

    monkeypatch.setattr(pipeline, "extract_file_text", boom)
    store.add(record(record_type="file"), [file(1, "sample.txt", "txt")])
    process_record("r1", store, index)
    assert store.records["r1"].status == "failed"
    # 내부 오류 내용은 사용자에게 보이는 칸에 넣지 않는다
    assert store.errors["r1"] == "가공 중 오류가 발생함"


def test_글자가_없는_파일은_제목과_파일_이름과_메모로_done이_된다(store, index):
    empty = RecordFile("f1", 1, "빈 사진.txt", "u1/r1/f1.txt", "txt")
    store.add(
        record(record_type="file", title="회의 사진", original_context="화이트보드"),
        [(empty, b"")],
    )
    process_record("r1", store, index)
    assert [c.text for c in index.saved["r1"]] == ["회의 사진\n빈 사진.txt\n화이트보드"]
    assert store.records["r1"].status == "done"


def test_원문을_못_가져온_링크는_제목과_주소와_메모로_done이_된다(store, index, monkeypatch):
    def fail(url):
        raise FetchError("원문 응답 403")

    monkeypatch.setattr(pipeline, "fetch_url_text", fail)
    store.add(
        record(
            record_type="url", information_content=None, title="유료 기사",
            source_url="https://example.com/paid", original_context="나중에 읽기",
        )
    )
    process_record("r1", store, index)
    assert [c.text for c in index.saved["r1"]] == [
        "유료 기사\nhttps://example.com/paid\n나중에 읽기"
    ]
    assert store.records["r1"].status == "done"


def test_링크의_원문은_조각으로_나뉜다(store, index, monkeypatch):
    monkeypatch.setattr(pipeline, "fetch_url_text", lambda url: "가" * 1500)
    store.add(record(record_type="url", source_url="https://example.com/a"))
    process_record("r1", store, index)
    assert [c.chunk_index for c in index.saved["r1"]] == [0, 1]


def test_자막이_없는_영상은_failed다(store, index, monkeypatch):
    def no_transcript(url):
        raise ProcessingError("영상의 자막을 찾지 못함")

    monkeypatch.setattr(pipeline, "fetch_transcript", no_transcript)
    store.add(record(record_type="video", source_url="https://youtu.be/abc"))
    process_record("r1", store, index)
    assert store.records["r1"].status == "failed"
    assert store.errors["r1"] == "영상의 자막을 찾지 못함"


def test_영상에서_얻은_글은_조각이_된다(store, index, monkeypatch):
    monkeypatch.setattr(pipeline, "fetch_transcript", lambda url: "영상 자막 글")
    store.add(record(record_type="video", source_url="https://youtu.be/abc"))
    process_record("r1", store, index)
    assert [c.text for c in index.saved["r1"]] == ["영상 자막 글"]


def test_가공_중에_지워진_기록은_저장하지_않고_멈춘다(store, index, monkeypatch):
    def delete_while_processing(url):
        store.records["r1"].status = "deleting"
        return "원문"

    monkeypatch.setattr(pipeline, "fetch_url_text", delete_while_processing)
    store.add(record(record_type="url", source_url="https://example.com/a"))
    process_record("r1", store, index)
    assert store.records["r1"].status == "deleting" and index.saved == {}


def test_저장_직전의_그룹을_벡터_저장에_넘긴다(store, index, monkeypatch):
    def move_group(url):
        store.records["r1"].group_id = "g2"
        return "원문"

    monkeypatch.setattr(pipeline, "fetch_url_text", move_group)
    store.add(record(record_type="url", source_url="https://example.com/a"))
    process_record("r1", store, index)
    assert index.group_ids["r1"] == "g2"


def test_두_번_처리해도_결과가_같다(store, index):
    store.add(record())
    process_record("r1", store, index)
    first = index.saved["r1"]
    store.records["r1"].status = "queued"
    process_record("r1", store, index)
    assert index.saved["r1"] == first and store.records["r1"].status == "done"
