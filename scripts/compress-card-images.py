#!/usr/bin/env python3
"""Compress the card image pack to WebP files under 1 KiB each.

The raw jpg downloads were removed after the first pack was built; this script
now reads the existing WebP files in place and re-encodes them smaller. It is
idempotent: source and output are the same directory, and each card is fully
decoded into memory before its file is overwritten.

Default layout: cards/card_img/goat/<8-digit-code>.webp
Default cap: 1 KiB (1024 bytes). The replay page displays cards at 90x90px,
so the source is intentionally smaller and scaled up by CSS (quality loss is
acceptable per the requirement).
"""

from __future__ import annotations

import argparse
import io
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover - environment guard
    sys.exit("Pillow is required: python3 -m pip install Pillow")


# (size, quality) pairs, best first. Each image falls through to a smaller /
# lower-quality variant until it fits under the byte cap.
STEPS: list[tuple[int, int]] = [
    (90, 40),
    (88, 35),
    (80, 40),
    (80, 32),
    (72, 40),
    (72, 32),
    (64, 45),
    (64, 36),
    (56, 45),
    (56, 36),
    (48, 50),
    (48, 40),
    (40, 50),
    (40, 40),
    (32, 50),
]


def compress_one(source: Path, max_bytes: int) -> tuple[bytes, int, int] | None:
    """Return (webp bytes, size, quality) or None when the cap cannot be met."""
    with Image.open(source) as raw:
        image = raw.convert("RGB")  # fully decode before the file is overwritten
        for size, quality in STEPS:
            resized = image.resize((size, size), Image.LANCZOS)
            buffer = io.BytesIO()
            resized.save(buffer, format="WEBP", quality=quality, method=6)
            data = buffer.getvalue()
            if len(data) <= max_bytes:
                return data, size, quality
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dir", default="cards/card_img/goat", help="image pack directory (re-encoded in place)")
    parser.add_argument("--max-bytes", type=int, default=1024, help="per-image byte cap")
    parser.add_argument("--extensions", default="webp,jpg,jpeg,png", help="source extensions to re-encode")
    args = parser.parse_args()

    img_dir = Path(args.dir)
    if not img_dir.is_dir():
        sys.exit(f"image directory not found: {img_dir}")

    extensions = tuple("." + e.strip().lstrip(".") for e in args.extensions.split(","))
    sources = sorted(p for p in img_dir.iterdir() if p.is_file() and p.suffix.lower() in extensions)
    if not sources:
        sys.exit(f"no images found in {img_dir}")

    total_before = 0
    total_after = 0
    failures: list[str] = []
    largest = 0

    for index, source in enumerate(sources, 1):
        total_before += source.stat().st_size
        result = compress_one(source, args.max_bytes)
        if result is None:
            failures.append(source.name)
            continue
        data, _, _ = result
        # Always write .webp so the resolver/content type stay consistent.
        target = source.with_suffix(".webp")
        target.write_bytes(data)
        total_after += len(data)
        largest = max(largest, len(data))
        if index % 300 == 0:
            print(f"  processed {index}/{len(sources)}", file=sys.stderr)

    print(f"images: {len(sources)}  written: {len(sources) - len(failures)}  failed: {len(failures)}")
    print(f"before: {total_before / 1024:.0f} KiB  after: {total_after / 1024:.0f} KiB")
    print(f"largest output: {largest} bytes (cap {args.max_bytes})")
    if failures:
        print("failed files: " + ", ".join(failures[:20]), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
