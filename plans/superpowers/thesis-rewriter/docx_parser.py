import re
from dataclasses import dataclass, field
from typing import List

CHAPTER_HEADING_RE = re.compile(r"^CHƯƠNG\s+\d+", re.IGNORECASE)


@dataclass
class ChapterBucket:
    title: str
    heading_index: int
    body_indices: List[int] = field(default_factory=list)


def is_chapter_heading(para) -> bool:
    return (
        para.style.name.startswith("Heading 1")
        or bool(CHAPTER_HEADING_RE.match(para.text.strip()))
    )


def detect_chapters(doc) -> List[ChapterBucket]:
    chapters: List[ChapterBucket] = []
    current: ChapterBucket = None
    for i, para in enumerate(doc.paragraphs):
        if is_chapter_heading(para):
            current = ChapterBucket(title=para.text.strip(), heading_index=i)
            chapters.append(current)
        elif current is not None and para.text.strip():
            current.body_indices.append(i)
    return chapters


def get_paragraph_text(para) -> str:
    return "".join(run.text for run in para.runs)


def replace_paragraph_text(para, new_text: str) -> None:
    if not para.runs:
        return
    para.runs[0].text = new_text
    for run in para.runs[1:]:
        run.text = ""


def clear_paragraph(para) -> None:
    replace_paragraph_text(para, "")
