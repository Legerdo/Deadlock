"""Contact sheets for reviewing generated art (alpha shown over a mid-grey checker)."""
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "art" / "raw"
OUT = ROOT / "artifacts" / "contact"
PLAN = json.loads((ROOT / "art" / "asset-plan.json").read_text(encoding="utf-8"))["assets"]


def checker(w, h, s=24):
    im = Image.new("RGB", (w, h), (120, 120, 128))
    d = ImageDraw.Draw(im)
    for y in range(0, h, s):
        for x in range(0, w, s):
            if (x // s + y // s) % 2:
                d.rectangle([x, y, x + s - 1, y + s - 1], fill=(150, 150, 158))
    return im


def sheet_characters():
    chars = []
    for a in PLAN:
        if a["kind"] in ("character", "expression") and a["character"] not in chars:
            chars.append(a["character"])
    cw, ch = 256, 384
    cols = 5
    im = Image.new("RGB", (cw * cols, (ch + 24) * len(chars)), (30, 28, 36))
    d = ImageDraw.Draw(im)
    for r, c in enumerate(chars):
        items = [a for a in PLAN if a.get("character") == c and a["kind"] in ("character", "expression")]
        for i, a in enumerate(items):
            src = RAW / f"{a['id']}.png"
            x, y = i * cw, r * (ch + 24)
            tile = checker(cw, ch)
            if src.exists():
                p = Image.open(src).convert("RGBA").resize((cw, ch), Image.LANCZOS)
                tile.paste(p, (0, 0), p)
            im.paste(tile, (x, y + 24))
            d.text((x + 6, y + 5), f"{c} · {a['expression']}", fill=(228, 240, 58))
    OUT.mkdir(parents=True, exist_ok=True)
    im.save(OUT / "characters.png")


def sheet_scenes():
    items = [a for a in PLAN if a["kind"] in ("keyart", "cutin", "environment")]
    cw, ch = 384, 256
    cols = 4
    rows = (len(items) + cols - 1) // cols
    im = Image.new("RGB", (cw * cols, (ch + 24) * rows), (30, 28, 36))
    d = ImageDraw.Draw(im)
    for i, a in enumerate(items):
        src = RAW / f"{a['id']}.png"
        x, y = (i % cols) * cw, (i // cols) * (ch + 24)
        if src.exists():
            p = Image.open(src).convert("RGB")
            p.thumbnail((cw, ch))
            im.paste(p, (x + (cw - p.width) // 2, y + 24))
        d.text((x + 6, y + 5), a["id"], fill=(228, 240, 58))
    im.save(OUT / "scenes.png")


if __name__ == "__main__":
    sheet_characters()
    sheet_scenes()
    print("contact sheets in artifacts/contact/")
