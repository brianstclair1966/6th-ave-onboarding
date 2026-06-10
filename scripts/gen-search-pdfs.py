#!/usr/bin/env python3
"""
Build the PDF full-text search index -> public/search-index.json.

Extracts the text of every resource PDF the onboarding app links (the local
files in public/), cleans it, and writes one record per PDF. The SearchBar
lazy-loads this file on first focus so agents can search the *contents* of the
forms (e.g. "1099", "wire fraud") and jump straight to the document.

This is a point-in-time snapshot: if a source PDF changes, re-run this script
(needs pdftotext, which is poppler-utils). It is NOT part of the Vercel build.
"""
import json
import re
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
OUT = PUBLIC / "search-index.json"

# Cap per-PDF text so one boilerplate-heavy form (the W-9's IRS instructions)
# can't dominate the index or bloat the file.
MAX_CHARS = 8000
# Scanned/image PDFs return ~no text from pdftotext; OCR up to this many pages.
OCR_MAX_PAGES = 4

# file (in public/) -> (page that links it, human label)
PDFS = [
    ("gfwar-transfer-form.pdf",            2, "GFWAR Transfer Form"),
    ("gfwar-autopay-enrollment.pdf",       2, "GFWAR Autopay Enrollment"),
    ("6th-ave-w9.pdf",                     3, "W-9 Form"),
    ("6th-ave-credit-card-authorization.pdf", 3, "Credit Card Authorization"),
    ("6th-ave-iabs.pdf",                   5, "IABS Form (Information About Brokerage Services)"),
    ("6th-ave-first-90-days.pdf",          9, "Your First 90 Days"),
]


def _norm(text: str) -> str:
    text = text.replace("\x0c", " ")
    return re.sub(r"\s+", " ", text).strip()


def ocr(pdf_path: Path) -> str:
    """Fallback for scanned/image PDFs: rasterize pages and run tesseract."""
    chunks = []
    with tempfile.TemporaryDirectory() as td:
        prefix = Path(td) / "pg"
        subprocess.run(
            ["pdftoppm", "-q", "-png", "-r", "200",
             "-l", str(OCR_MAX_PAGES), str(pdf_path), str(prefix)],
            capture_output=True,
        )
        for img in sorted(Path(td).glob("pg*.png")):
            res = subprocess.run(
                ["tesseract", str(img), "-", "--psm", "6"],
                capture_output=True, text=True,
            )
            chunks.append(res.stdout or "")
    return _norm(" ".join(chunks))


def extract(pdf_path: Path) -> str:
    out = subprocess.run(
        ["pdftotext", "-q", str(pdf_path), "-"],
        capture_output=True, text=True,
    )
    text = _norm(out.stdout or "")
    if len(text) < 40:  # image-only PDF -> OCR
        text = ocr(pdf_path)
    return text[:MAX_CHARS]


def main():
    records = []
    for fname, page, label in PDFS:
        fp = PUBLIC / fname
        if not fp.exists():
            print(f"  ! missing {fname}, skipping")
            continue
        text = extract(fp)
        records.append({
            "page": page,
            "slug": fname,
            "label": label,
            "type": "pdf",
            "url": f"/{fname}",
            "text": text,
        })
        print(f"  + {fname}: {len(text)} chars (page {page})")

    OUT.write_text(json.dumps(records, ensure_ascii=False))
    print(f"[gen-search-pdfs] wrote {len(records)} records -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
