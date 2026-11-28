import pytest
from fastapi.testclient import TestClient

from index.null import NullIndex
from main import app, get_index, get_store
from stores.base import Record
from stores.memory import MemoryStore

RECORD_ID = "3f2b8c1e-5d47-4a9b-8e6f-1c2d3e4f5a6b"


@pytest.fixture
def store(monkeypatch):
    monkeypatch.setenv("WORKER_SECRET", "test-secret")
    store = MemoryStore()
    app.dependency_overrides[get_store] = lambda: store
    app.dependency_overrides[get_index] = NullIndex
    yield store
    app.dependency_overrides.clear()


client = TestClient(app)


def post(secret: str | None, record_id: str = RECORD_ID):
    headers = {"X-Worker-Secret": secret} if secret is not None else {}
    return client.post("/process", json={"record_id": record_id}, headers=headers)


def test_health():
    assert client.get("/health").json() == {"ok": True}


def test_비밀값이_없거나_다르면_401(store):
    assert post(None).status_code == 401
    assert post("wrong").status_code == 401
    assert post("").status_code == 401


def test_서버에_비밀값을_설정하지_않으면_모든_요청을_거부한다(store, monkeypatch):
    monkeypatch.delenv("WORKER_SECRET")
    assert post("").status_code == 401
    assert post("test-secret").status_code == 401


def test_맞는_비밀값이면_202로_받고_뒤에서_가공한다(store):
    store.add(
        Record(RECORD_ID, "u1", "g1", "memo", "queued", information_content="메모")
    )
    response = post("test-secret")
    assert response.status_code == 202
    assert response.json() == {"record_id": RECORD_ID, "accepted": True}
    # TestClient는 응답 뒤 백그라운드 작업까지 끝내고 돌아온다
    assert store.records[RECORD_ID].status == "done"


def test_없는_기록도_요청은_받는다(store):
    assert post("test-secret").status_code == 202


def test_record_id가_uuid가_아니면_422(store):
    assert post("test-secret", "not-a-uuid").status_code == 422
