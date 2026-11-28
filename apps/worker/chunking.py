"""글을 원문 조각으로 나눈다. 문단 단위로 자르고 정해진 크기 안팎으로 묶는다."""

import re

import config


def split_chunks(text: str, size: int = config.CHUNK_SIZE) -> list[str]:
    chunks: list[str] = []
    current = ""
    for paragraph in re.split(r"\n\s*\n", text):
        paragraph = paragraph.strip()
        if not paragraph:
            continue
        if current and len(current) + len(paragraph) + 2 > size:
            chunks.append(current)
            current = ""
        # 한 문단이 크기를 넘으면 크기대로 자른다
        while len(paragraph) > size:
            chunks.append(paragraph[:size])
            paragraph = paragraph[size:]
        current = f"{current}\n\n{paragraph}" if current else paragraph
    if current:
        chunks.append(current)
    return chunks
