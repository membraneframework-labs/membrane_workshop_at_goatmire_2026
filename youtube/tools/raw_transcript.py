#!/usr/bin/env python3
"""Write scenario_raw.md next to a scenario.md: only the spoken lines of Version A, as plain paragraphs.

Usage: python3 youtube/tools/raw_transcript.py youtube/NN-slug/scenario.md
"""
import os
import re
import sys


def main(path):
    src = open(path, encoding="utf-8").read()
    title = re.search(r"^# (.+)$", src, re.M).group(1)
    m = re.search(r"## Version A.*?(?=\n## Version B|\Z)", src, re.S)
    body = m.group(0) if m else src
    paragraphs, current = [], []
    for line in body.splitlines():
        if line.startswith(">"):
            current.append(line[1:].strip())
        elif current:
            paragraphs.append(" ".join(current))
            current = []
    if current:
        paragraphs.append(" ".join(current))
    out = os.path.join(os.path.dirname(os.path.abspath(path)), "scenario_raw.md")
    with open(out, "w", encoding="utf-8") as f:
        f.write(f"# {title}\n\n")
        f.write("\n\n".join(paragraphs) + "\n")
    print(f"{out}: {len(paragraphs)} paragraphs, {sum(len(p.split()) for p in paragraphs)} words")


if __name__ == "__main__":
    for p in sys.argv[1:]:
        main(p)
