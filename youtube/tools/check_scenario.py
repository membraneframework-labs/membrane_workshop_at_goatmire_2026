#!/usr/bin/env python3
"""Lint a scenario.md: spoken length, leftover review comments, banned phrases, non-English characters.

Usage: python3 youtube/tools/check_scenario.py youtube/NN-slug/scenario.md
Exit code 1 if anything blocking is found (comments left, banned phrases, non-ASCII letters).
"""
import re
import sys

WPM = 150  # the author's pace is on the slow side of conversational English

# Patterns that violated the author's decisions in the past. Case-insensitive, spoken lines only.
BANNED = [
    (r"\blast episode\b", "no 'last episode': episodes stand alone and order may change"),
    (r"\bprevious episode\b", "no 'previous episode': episodes stand alone"),
    (r"\brepo\b|\brepository\b", "no repo mentions in spoken text: the viewer doesn't know any repo"),
    (r"\bworkshop\b", "no workshop mentions in spoken text"),
    (r"\bhere's the thing\b", "YouTuber tic, author rejects it"),
    (r"\bthat's it\b", "YouTuber tic, author rejects it"),
    (r"\byou've probably seen\b|\byou probably know\b", "audience has no multimedia background, don't assume"),
    (r"\bshort for\b|\bportmanteau\b|\betymology\b", "no etymology asides"),
    (r"\bwe built\b|\bwe'll build\b|\blet's build\b", "the series builds nothing"),
    (r"\bcheckpoint\b|\bour solution\b|\bexercise\b|\btask\b", "workshop vocabulary"),
    (r"\bper second\. per second\b", "staccato repetition"),
]

# Short sentence fragments in a row are the 'AI style' the author rejects. We flag runs of 3+ consecutive
# sentences of 4 words or fewer.
def fragment_runs(text):
    sentences = re.split(r"(?<=[.!?])\s+", text)
    run, out = [], []
    for s in sentences:
        words = len(s.split())
        if 0 < words <= 4:
            run.append(s)
        else:
            if len(run) >= 3:
                out.append(" ".join(run))
            run = []
    if len(run) >= 3:
        out.append(" ".join(run))
    return out


def main(path):
    src = open(path, encoding="utf-8").read()
    problems, notes = [], []

    # Version A spoken lines
    m = re.search(r"## Version A.*?(?=\n## Version B|\Z)", src, re.S)
    body = m.group(0) if m else src
    spoken_lines = [l[1:].strip() for l in body.splitlines() if l.startswith(">")]
    spoken = " ".join(spoken_lines)
    words = len(spoken.split())
    minutes = words / WPM
    notes.append(f"spoken words: {words}  (~{minutes:.1f} min at {WPM} wpm)")
    if minutes > 8:
        problems.append(f"too long: {minutes:.1f} min, ceiling is 8")
    if minutes < 3:
        problems.append(f"too short: {minutes:.1f} min, floor is 3")

    # Leftover review comments: {...} outside code blocks
    no_code = re.sub(r"```.*?```", "", src, flags=re.S)
    comments = [c for c in re.findall(r"\{[^}]*\}", no_code) if not re.match(r"\{\s*$", c)]
    for c in comments:
        problems.append(f"review comment left in file: {c[:80]}")

    # Banned phrases in spoken text
    for pat, why in BANNED:
        for hit in re.finditer(pat, spoken, re.I):
            problems.append(f"banned phrase '{hit.group(0)}': {why}")

    # Fragment runs
    for run in fragment_runs(spoken):
        notes.append(f"check staccato run: \"{run[:100]}\"")

    # Non-English letters anywhere
    if re.search(r"[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]", src):
        problems.append("Polish characters found, file must be 100% English")

    # Placeholders
    for hit in re.finditer(r"\bTODO\b|\bTBD\b|\bXXX\b|\[name\]", src):
        if hit.group(0) != "[name]":
            problems.append(f"placeholder left: {hit.group(0)}")

    # Structure
    for section in ("## Facts that must land", "## Version A", "## Version B"):
        if section not in src:
            notes.append(f"section missing: {section}")
    if "images/" not in src:
        notes.append("no pointer to images/ in stage directions")

    # images/README.md times vs stage directions
    import os
    readme = os.path.join(os.path.dirname(os.path.abspath(path)), "images", "README.md")
    if os.path.exists(readme):
        direction_times = {}
        for line in body.splitlines():
            m2 = re.match(r"\*\*\[(\d+:\d\d)\]", line)
            if not m2:
                continue
            for f in re.findall(r"`(\d\d-[a-z0-9-]+?)(?:-\d)?\.png`", line):
                direction_times.setdefault(f, m2.group(1))
        for row in open(readme, encoding="utf-8"):
            m3 = re.match(r"\| `(\d\d-[a-z0-9-]+?)(?:-\d)?`[^|]*\| ([^|]*)\|", row)
            if not m3:
                continue
            name, cell = m3.group(1), m3.group(2)
            if name in direction_times and direction_times[name] not in cell:
                problems.append(f"images/README.md: `{name}` says {cell.strip()!r}, script says {direction_times[name]}")

    for n in notes:
        print("note:", n)
    for p in problems:
        print("PROBLEM:", p)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
