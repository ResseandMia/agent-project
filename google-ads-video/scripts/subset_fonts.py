"""Subset the full fonts in build/fonts-full/ to the characters the video uses → public/fonts/.

The Noto Sans SC files are ~10 MB each; the subsets are a few hundred KB, which keeps the repo small.
Characters are collected from the storyboard, the timeline and every source file under src/.
"""
import glob
import os
import string

from fontTools import subset

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "build/fonts-full")
DST = os.path.join(ROOT, "public/fonts")

chars = set(string.printable)
chars |= set("，。！？；：、“”‘’（）【】《》—…·￥¥÷×＋－＝≈→←↑↓✓✗★☆●○①②③④⑤％～｜")
for pattern in ["src/**/*.tsx", "src/**/*.ts", "src/data/*.json", "docs/*.md"]:
    for p in glob.glob(os.path.join(ROOT, pattern), recursive=True):
        with open(p, encoding="utf-8") as f:
            chars |= set(f.read())
text = "".join(sorted(c for c in chars if c.isprintable()))

os.makedirs(DST, exist_ok=True)
for fp in sorted(glob.glob(os.path.join(SRC, "*.ttf"))):
    out = os.path.join(DST, os.path.basename(fp))
    opts = subset.Options()
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    font = subset.load_font(fp, opts)
    sub = subset.Subsetter(opts)
    sub.populate(text=text)
    sub.subset(font)
    subset.save_font(font, out, opts)
    print(f"{os.path.basename(fp):28s} {os.path.getsize(fp)/1e6:6.2f} MB -> {os.path.getsize(out)/1e3:7.1f} KB")
print(f"{len(text)} characters kept")
