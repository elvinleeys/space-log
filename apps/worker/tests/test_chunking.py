from chunking import split_chunks


def test_짧은_문단은_한_조각으로_묶는다():
    assert split_chunks("첫 문단\n\n둘째 문단", size=100) == ["첫 문단\n\n둘째 문단"]


def test_크기를_넘으면_문단_사이에서_나눈다():
    assert split_chunks("가" * 60 + "\n\n" + "나" * 60, size=100) == ["가" * 60, "나" * 60]


def test_긴_문단은_크기대로_자른다():
    chunks = split_chunks("가" * 250, size=100)
    assert [len(c) for c in chunks] == [100, 100, 50]


def test_빈_글은_조각이_없다():
    assert split_chunks("") == []
    assert split_chunks(" \n\n \n") == []
