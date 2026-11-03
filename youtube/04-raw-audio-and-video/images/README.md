# Episode 04 · overlay graphics for post-production

Everything here is meant to be placed into the frame next to the presenter, not shown full
screen. The PNGs are cropped to their content, have a transparent background (with a small
transparent margin so the card's shadow is kept), and are rendered at 2× so they stay sharp when
scaled down. Two variants of every graphic:

- `on-card/` – on a white rounded card with a soft shadow. Works on any video background.
- `no-card/` – bare, navy on transparent. For light backgrounds or your own card.

Numbers follow the order in `../scenario.md`; the time column is the stage direction the graphic
belongs to. A `-1`, `-2`, … suffix means build-up steps of one graphic: all steps have the same
size, so cut from one to the next as the line is spoken and nothing jumps.

| File | Script time | What it is |
|---|---|---|
| `01-hexdump` | 0:00 | 160 real bytes of a raw I420 frame (`video.raw`, frame 100, a row through the title card) as a plain hex dump: offsets on the left, nothing coloured, nothing to read |
| `02-rows-1` … `02-rows-3` | 1:00 | A tiny 6 × 4 frame: its 24 pixels as one long row, then folded into rows of the frame's width, then one pixel found by skipping two full rows and moving three along the third (the rest dimmed, the two labels say it, no caption) |
| `03-rgb` | 1:35 | A two by two RGB frame with four colour swatches, and its twelve bytes in a row, grouped in threes under a copy of their pixel, tinted red, green, blue, each with its decimal value |
| `04-i420` | 2:05 | One frame as three planes: the full-size Y plane ("brightness, 1 byte per pixel") and the quarter-size U and V planes ("colour, 1 byte per 2×2 block"), "1.5 bytes per pixel on average" under it |
| `05-samples` | 2:55 | A smooth wave over a light baseline, dots at regular intervals, six of them labelled with their sample value |
| `06-interleaved` | 3:20 | Six real 16-bit samples of `audio.raw` (one second in), each as two bytes, labelled L, R, L, R, L, R; captions "one sample = 2 bytes", "stereo, interleaved" |
| `07-sentence` | 4:00 | Text card: "Raw data doesn't describe itself." (same style as episode 01's `11-raw-in-the-middle`) |
| `08-stream-format` | 4:30 | Two cards: Raw video (width, height, pixel format), Raw audio (sample rate, sample format, channels) |
| `09-pipeline` | 5:05 | The pipeline, data flowing top to bottom, two branches that do not merge: video on the left (File.Source, IVF.Deserializer, Transcoder "VP8 → raw video", File.Sink), audio on the right (File.Source, Transcoder "MP3 → raw audio", File.Sink), with the two input files above and the two output files below drawn as dashed stream shapes |
| `10-terminal` | 6:35 | One dark terminal panel: `wc -c` with the real byte counts of the four files (the total line left out), then the two ffplay commands with the format flags and their values highlighted |
| `11-takeaway` | 7:20 | The takeaway sentences |

`_preview/` holds the two layouts of the terminal: `10-terminal-A-one-panel` (the one in use,
identical
to `10-terminal`) and the split variant `10-terminal-sizes` + `10-terminal-ffplay`, in case you
prefer to
cut between the sizes and the commands; delete it once decided.

Code snippets are not here on purpose: they come from the Keynote presentation. No licensed
material is used: the hex bytes in `01-hexdump` and the sample bytes in `06-interleaved` are real
bytes of the `video.raw` and `audio.raw` files written by `../example/ivf_mp3_to_raw.exs`
(`xxd -s $((194400*100 + 480*120 + 160)) -l 160 video.raw` and `xxd -s 176400 -l 12 audio.raw`),
and the sizes in `10-terminal` are the measured sizes from `../notes/facts.md`. The 6 × 4 picture
in `02-rows`, the four colours in `03-rgb`, the plane shading in `04-i420` and the wave in
`05-samples` are drawn, not taken from the clip.

## Regenerating

Everything is drawn by `../graphics/render.cjs` (HTML and CSS, screenshotted with Playwright)
on top of `../../tools/overlays.cjs`. It uses the Playwright installed under `presentation/`:

```
cd presentation
NODE_PATH=node_modules node ../youtube/04-raw-audio-and-video/graphics/render.cjs
```

Add `--preview` to also regenerate `_preview/`.
