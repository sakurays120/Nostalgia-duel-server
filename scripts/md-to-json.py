#!/usr/bin/env python3
"""Convert the scraped card markdown files into compact, HTML-free JSON.

Source: cards/cards_data/<8-digit-code>.md  (HTML-wrapped scraped pages, removed after pack)
Output: cards/cards_data/<code>.json

The scraped pages are a fixed set of <div class="head">label</div> followed by
<div class="val">value</div> pairs. This script pairs them in document order,
strips all markup/entities, and keeps only meaningful card fields. The output
schema is deliberately close to the API's CardDetails shape so the endpoint can
serve it directly.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path


# label (as it appears in <div class="head">) -> output JSON key
FIELD_MAP: dict[str, str] = {
    "中文名": "name",
    "日文名": "nameJa",
    "英文名": "nameEn",
    "卡片种类": "typeText",
    "卡片密码": "code",
    "使用限制": "limitation",
    "罕见度": "rarity",
    "卡包": "packs",
    "效果": "desc",
    "种族": "raceText",
    "属性": "attributeText",
    "星级": "level",
    "攻击力": "attack",
    "防御力": "defense",
    "介绍": "intro",
    "FAQ": "faq",
    "裁决": "ruling",
    "QAS": "qas",
    "卡片勘误": "errata",
}

# section header that is not a field; its following head/val pairs are real
SKIP_LABELS = {"事务局FAQ（裁决、调整）：", "事务局FAQ（裁决、调整）"}

HEAD_RE = re.compile(r'<div class="head[^"]*"[^>]*>(.*?)</div>', re.S)
VAL_RE = re.compile(r'<div class="val[^"]*"[^>]*>(.*?)</div>', re.S)
TAG_RE = re.compile(r"<[^>]+>")
SPAN_RE = re.compile(r"<span[^>]*>(.*?)</span>", re.S)


def clean_text(fragment: str) -> str:
    """Strip markup, decode entities, normalise whitespace, drop placeholders."""
    text = TAG_RE.sub("", fragment)
    text = html.unescape(text)
    text = text.replace("\u3000", " ").replace("\xa0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\s*\n\s*", "\n", text).strip()
    if text in ("-", "—", ""):
        return ""
    return text


def span_join(fragment: str) -> str:
    """Join <span> contents with '·' (card type is split across spans)."""
    spans = SPAN_RE.findall(fragment)
    if not spans:
        return clean_text(fragment)
    parts = [clean_text(s) for s in spans]
    parts = [p for p in parts if p]
    return "·".join(parts)


def parse_markdown(raw: str) -> dict[str, str]:
    heads = [clean_text(m.group(1)) for m in HEAD_RE.finditer(raw)]
    val_nodes = list(VAL_RE.finditer(raw))
    val_texts = [clean_text(m.group(1)) for m in val_nodes]

    result: dict[str, str] = {}
    vi = 0
    for label in heads:
        # The 事务局FAQ row is a section header with no <div class="val">.
        if label in SKIP_LABELS:
            continue
        if vi >= len(val_texts):
            break
        key = FIELD_MAP.get(label)
        if key is None:
            vi += 1
            continue
        if label == "卡片种类":
            result[key] = span_join(val_nodes[vi].group(1))
        else:
            # Keep empty values ("-") so head/val stay index-aligned; fields
            # like 介绍/裁决/QAS legitimately have a dash placeholder.
            result[key] = val_texts[vi]
        vi += 1
        # 使用限制 has a second, empty <div class="val"> cell in the scraped
        # layout. Consume it so subsequent fields stay aligned.
        if label == "使用限制" and vi < len(val_texts) and val_texts[vi] == "":
            vi += 1
    return result


def to_int(value: str) -> int:
    digits = re.sub(r"[^0-9]", "", value)
    try:
        return int(digits) if digits else 0
    except ValueError:
        return 0


def build_card(code: str, fields: dict[str, str]) -> dict:
    """Map scraped fields into the API CardDetails-compatible shape."""
    return {
        "id": to_int(fields.get("code", code)) or to_int(code),
        "code": fields.get("code", code),
        "name": fields.get("name", ""),
        "nameJa": fields.get("nameJa", ""),
        "nameEn": fields.get("nameEn", ""),
        "typeText": fields.get("typeText", ""),
        "limitation": fields.get("limitation", ""),
        "rarity": fields.get("rarity", ""),
        "packs": fields.get("packs", ""),
        "desc": fields.get("desc", ""),
        "raceText": fields.get("raceText", ""),
        "attributeText": fields.get("attributeText", ""),
        "level": to_int(fields.get("level", "0")),
        "attack": to_int(fields.get("attack", "0")),
        "defense": to_int(fields.get("defense", "0")),
        "intro": fields.get("intro", ""),
        "faq": fields.get("faq", ""),
        "ruling": fields.get("ruling", ""),
        "qas": fields.get("qas", ""),
        "errata": fields.get("errata", ""),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--src", default="cards/cards_data", help="source markdown directory")
    parser.add_argument("--out", default="cards/cards_data", help="output JSON root")
    parser.add_argument("--format", default="goat", help="format folder name")
    args = parser.parse_args()

    src_dir = Path(args.src)
    out_dir = Path(args.out) / args.format
    if not src_dir.is_dir():
        sys.exit(f"source directory not found: {src_dir}")
    out_dir.mkdir(parents=True, exist_ok=True)

    sources = sorted(src_dir.glob("*.md"))
    if not sources:
        sys.exit(f"no .md files in {src_dir}")

    total_before = 0
    total_after = 0
    warnings: list[str] = []

    for source in sources:
        raw = source.read_text(encoding="utf-8")
        total_before += len(raw.encode("utf-8"))
        fields = parse_markdown(raw)
        card = build_card(source.stem, fields)
        if not card["name"]:
            warnings.append(f"{source.name}: no 中文名 parsed")
        payload = json.dumps(card, ensure_ascii=False, separators=(",", ":"))
        target = out_dir / (source.stem + ".json")
        target.write_text(payload, encoding="utf-8")
        total_after += len(payload.encode("utf-8"))

    print(f"cards: {len(sources)}  written: {len(sources)}  warnings: {len(warnings)}")
    print(f"before: {total_before / 1024 / 1024:.1f} MiB  after: {total_after / 1024 / 1024:.1f} MiB")
    if warnings:
        print("warnings: " + "; ".join(warnings[:20]), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
