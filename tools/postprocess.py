"""Deterministic post-processing for Codex-generated art.

raw PNG (art/raw/<id>.png)  ->  runtime WebP under public/assets/generated/
  * characters/expressions: alpha kept (chroma-keyed if the tool fell back to #00FF00),
    full 2:3 canvas kept so expression swaps stay aligned; a 512px-wide copy for 3D billboards.
  * scenes: resized, opaque WebP.
Writes public/assets/generated/manifest.json with provenance + alpha bounding boxes.
Usage: python tools/postprocess.py [asset_id ...]
"""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "art" / "raw"
OUT = ROOT / "public" / "assets" / "generated"
PLAN = json.loads((ROOT / "art" / "asset-plan.json").read_text(encoding="utf-8"))
MANIFEST = OUT / "manifest.json"

PURPOSE = {
    "character": "canonical full-body portrait (dialogue + 3D billboard)",
    "expression": "expression variant derived by image edit from the canonical portrait",
    "keyart": "title screen key visual",
    "cutin": "story cut-in illustration",
    "environment": "3D environment texture (poster / mural / window)",
}


def chroma_key(im: Image.Image) -> Image.Image:
    """Remove a flat #00FF00 background if the image has no usable alpha."""
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if g > 180 and r < 120 and b < 120:
                px[x, y] = (r, g, b, 0)
            elif g > r + 40 and g > b + 40:  # green spill on edges
                px[x, y] = (r, (r + b) // 2, b, a)
    return im


def ensure_alpha(im: Image.Image) -> tuple[Image.Image, bool]:
    if im.mode == "RGBA":
        lo, _ = im.getchannel("A").getextrema()
        if lo < 10:
            return im, True
    return chroma_key(im), True


def clean_fringe(im: Image.Image) -> Image.Image:
    """Zero out nearly transparent pixels so billboards get clean alphaTest edges."""
    r, g, b, a = im.split()
    a = a.point(lambda v: 0 if v < 12 else v)
    return Image.merge("RGBA", (r, g, b, a))


def bbox_norm(im: Image.Image):
    box = im.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()
    if not box:
        return None
    w, h = im.size
    return [round(box[0] / w, 4), round(box[1] / h, 4), round(box[2] / w, 4), round(box[3] / h, 4)]


def process(asset: dict, previous: dict) -> dict | None:
    src = RAW / f"{asset['id']}.png"
    if not src.exists():
        return previous.get(asset["id"])
    im = Image.open(src)
    rel = Path(asset["out"]).with_suffix(".webp")
    dst = OUT / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "id": asset["id"],
        "file": f"assets/generated/{rel.as_posix()}",
        "purpose": PURPOSE[asset["kind"]],
        "character": asset.get("character"),
        "expression": asset.get("expression"),
        "source": "codex-cli",
        "generationMode": asset["mode"],
        "model": "Codex CLI built-in image_gen (image model not exposed by the tool); agent model gpt-6-luna",
        "promptFile": f"art/prompts/{asset['id']}.md",
        "referenceAssets": [asset["ref"]] if asset.get("ref") else [],
        "rawFile": f"art/raw/{asset['id']}.png",
        "rawDimensions": f"{im.width}x{im.height}",
    }
    if asset["kind"] in ("character", "expression"):
        im, _ = ensure_alpha(im)
        im = clean_fringe(im)
        full = im.resize((1024, 1536), Image.LANCZOS) if im.size != (1024, 1536) else im
        full.save(dst, "WEBP", quality=90, method=6)
        small_rel = Path(asset["out"]).parent / "sm" / Path(asset["out"]).with_suffix(".webp").name
        small = OUT / small_rel
        small.parent.mkdir(parents=True, exist_ok=True)
        full.resize((512, 768), Image.LANCZOS).save(small, "WEBP", quality=90, method=6)
        entry.update(
            dimensions="1024x1536",
            smallFile=f"assets/generated/{small_rel.as_posix()}",
            transparent=True,
            bbox=bbox_norm(full),
        )
    else:
        im = im.convert("RGB")
        target = {"1536x1024": (1536, 1024), "1024x1536": (1024, 1536), "1024x1024": (1024, 1024)}[asset["size"]]
        if im.size != target:
            im = im.resize(target, Image.LANCZOS)
        im.save(dst, "WEBP", quality=86, method=6)
        entry.update(dimensions=f"{target[0]}x{target[1]}", transparent=False)
    print(f"ok {asset['id']} -> {entry['file']}")
    return entry


def main():
    only = set(sys.argv[1:])
    previous = {}
    if MANIFEST.exists():
        previous = {e["id"]: e for e in json.loads(MANIFEST.read_text(encoding="utf-8"))["assets"]}
    entries = []
    for asset in PLAN["assets"]:
        if only and asset["id"] not in only:
            if asset["id"] in previous:
                entries.append(previous[asset["id"]])
            continue
        e = process(asset, previous)
        if e:
            entries.append(e)
    OUT.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(
        json.dumps({"generatedBy": "tools/postprocess.py", "assets": entries}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    missing = [a["id"] for a in PLAN["assets"] if not any(e["id"] == a["id"] for e in entries)]
    print(f"manifest: {len(entries)} assets; missing: {missing or 'none'}")


if __name__ == "__main__":
    main()
