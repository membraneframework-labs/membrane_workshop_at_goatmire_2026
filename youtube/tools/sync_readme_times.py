#!/usr/bin/env python3
"""Copy the stage-direction times of a scenario into its images/README.md table.

Usage: python3 youtube/tools/sync_readme_times.py youtube/NN-slug/scenario.md

Every row of the README table whose first cell names an overlay (`NN-name` or
`NN-name-1` … `NN-name-4`) gets the time of the first stage direction that names that
overlay. A "`-6` comes back at m:ss" note is updated from the stage direction that says
"comes back". Run it after youtube/tools/retime.py --write.
"""
import re
import sys
from pathlib import Path


def main(scenario: str) -> int:
    sc_path = Path(scenario)
    readme = sc_path.parent / "images" / "README.md"
    if not readme.exists():
        print(f"no README at {readme}")
        return 1
    sc = sc_path.read_text(encoding="utf-8")
    times: dict[str, str] = {}
    for m in re.finditer(r"^\*\*\[(\d:\d\d)\][^\n]*", sc, re.M):
        for f in re.findall(r"`(\d\d[\w-]*?)(?:-\d)?\.png`", m.group(0)):
            times.setdefault(f, m.group(1))
    text = readme.read_text(encoding="utf-8")

    def fix(m: re.Match) -> str:
        key = re.sub(r"-\d$", "", m.group(1).split("`")[0])
        return f"| `{m.group(1)}` | {times.get(key, m.group(2))} |"

    new = re.sub(r"\| `([^|]+?)` \| (\d:\d\d) \|", fix, text)
    back = re.search(r"\*\*\[(\d:\d\d)\] Overlay `(\d\d[\w-]*?)-(\d)\.png` comes back", sc)
    if back:
        new = re.sub(r"(`-%s` comes back at )\d:\d\d" % back.group(3), r"\g<1>" + back.group(1), new)
    if new != text:
        readme.write_text(new, encoding="utf-8")
        print("README times updated")
    else:
        print("README times already in sync")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
