#!/usr/bin/env python3
"""Recompute the [m:ss] marks of the stage directions in a scenario.md from the spoken word count.

Usage: python3 youtube/tools/retime.py youtube/NN-slug/scenario.md [--write]

Rules (the ones used for episodes 01 and 02): 150 words per minute, the bumper lasts 5 seconds,
times are rounded to 5 seconds. The cold open starts at 0:00, the bumper starts when the cold open's
words are spoken, everything after it is shifted by the bumper. Only Version A is touched. Without
--write the new marks are printed next to the old ones.
"""
import re
import sys

WPM = 150
BUMPER = 5


def fmt(secs):
    secs = int(round(secs / 5.0) * 5)
    return f"{secs // 60}:{secs % 60:02d}"


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    path = sys.argv[1]
    write = "--write" in sys.argv
    text = open(path, encoding="utf-8").read()
    head, rest = text.split("## Version A", 1)
    body, tail = rest.split("## Version B", 1)

    out = []
    words = 0
    shift = 0
    in_code = False
    for line in body.split("\n"):
        if line.startswith("```"):
            in_code = not in_code
        m = re.match(r"\*\*\[(\d+:\d\d)\]", line)
        if m and not in_code:
            secs = words / WPM * 60 + shift
            new = fmt(secs)
            if new != m.group(1):
                print(f"{m.group(1)} -> {new}  {line[:72]}")
            line = line.replace(f"[{m.group(1)}]", f"[{new}]", 1)
            if "Bumper" in line:
                shift += BUMPER
        elif line.startswith(">") and not in_code:
            words += len(line[1:].split())
        out.append(line)
    print(f"spoken words: {words}  (~{words / WPM:.1f} min)")
    if write:
        open(path, "w", encoding="utf-8").write(head + "## Version A" + "\n".join(out) + "## Version B" + tail)
        print("written")
    return 0


if __name__ == "__main__":
    sys.exit(main())
