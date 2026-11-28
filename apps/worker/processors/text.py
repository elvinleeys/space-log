"""txt, md, csv: 글자를 그대로 읽는다."""


def extract_text(data: bytes) -> str:
    # 엑셀에서 저장한 한글 csv는 CP949인 경우가 많다
    for encoding in ("utf-8-sig", "cp949"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="replace")
