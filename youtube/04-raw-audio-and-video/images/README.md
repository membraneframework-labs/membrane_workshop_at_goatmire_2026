# Episode 04 · overlay graphics for post-production

Everything here is meant to be placed into the frame next to the presenter, not shown full screen.
The PNGs are cropped to their content, have a transparent background (with a small transparent
margin so the card's shadow is kept), and are rendered at 2× so they stay sharp when scaled down.
Two variants of every graphic:

- `on-card/` – on a white rounded card with a soft shadow. Works on any video background.
- `no-card/` – bare, navy on transparent. For light backgrounds or your own card.

Numbers follow the order in `../scenario.md`; the time column is the stage direction the graphic
belongs to. A `-1`, `-2`, … suffix means build-up steps of one graphic: all steps have the same
size, so cut from one to the next as the line is spoken and nothing jumps.

| File | Script time | What it is |
|---|---|---|
| `01-hexdump` | 0:00 | 160 real bytes of a raw I420 frame (`video.raw`, frame 100, a row through the title card) as a plain hex dump: offsets on the left, nothing coloured, nothing to read |
| `02-rows-1` … `02-rows-3` | 1:00 | A frame of 24 pixels drawn as plain squares, each numbered by its position in memory (0 to 23): as one long strip ("each square is one pixel"), then folded into rows of six, then pixel 15 found by skipping two full rows (bracket on the right, "skip 2 full rows") and moving three along the third (bracket underneath, "then 3 along the row"), the rest dimmed, caption "pixel 15" |
| `03-rgb` | 1:35 | The two by two RGB frame ("the picture"), its pixels lettered A to D, and under it the same frame in memory ("the same frame in memory"): a dashed strip with the twelve bytes grouped in threes under the letter and colour of their pixel, tinted red, green, blue, each with its decimal value and its byte position 0 to 11; key "red · green · blue" |
| `04-i420` | 2:05 | A 6 × 4 picture (sky, sun, ground; "the picture"), and under it the same frame in memory as I420: a dashed strip with the three planes one after another, Y as 24 grey cells ("Y · brightness", "24 bytes"), U and V as 3 × 2 block-sized cells in the colours a video tool shows them ("U · colour" / "V · colour", "6 bytes"); caption "1.5 bytes per pixel on average" |
| `05-samples` | 2:55 | A smooth wave over a light baseline, dots at regular intervals, four of them labelled with their sample value (a peak, a point on the slope, a trough, one more); no caption |
| `06-interleaved` | 3:15 | Six real 16-bit samples of `audio.raw` (one second in), each as two bytes, labelled L, R, L, R, L, R; captions "one sample = 2 bytes", "stereo, interleaved" |
| `07-sentence` | 4:05 | Text card: "Raw data doesn't describe itself." (same style as episode 01's `11-raw-in-the-middle`) |
| `08-stream-format` | 4:35 | Two cards: Raw video (width, height, pixel format), Raw audio (sample rate, sample format, channels) |
| `09-pipeline` | 5:25 | The pipeline, data flowing top to bottom, two branches that do not merge: video on the left (File.Source, IVF.Deserializer, Transcoder "VP8 → raw video", File.Sink), audio on the right (File.Source, Transcoder "MP3 → raw audio", File.Sink), with the two input files above and the two output files below drawn as dashed stream shapes |
| `10-terminal` | 6:55 | One dark terminal panel: `wc -c` with the real byte counts of the four files (the total line left out), then the two ffplay commands with the format flags and their values highlighted |
| `11-takeaway` | 7:40 | The takeaway card: "Raw data doesn't describe itself." and, lighter, "In Membrane, that's the stream format." |

`_preview/` holds `03-rgb-B-one-pixel` (an alternative for `03-rgb`: a single pixel and its three
bytes) and the two layouts of the terminal: `10-terminal-A-one-panel` (the one in use, identical
to `10-terminal`) and the split variant `10-terminal-sizes` + `10-terminal-ffplay`, in case you
prefer to cut between the sizes and the commands; delete it once decided.

Code snippets are not here on purpose: they come from the Keynote presentation. No licensed
material is used: the hex bytes in `01-hexdump` and the sample bytes in `06-interleaved` are real
bytes of the `video.raw` and `audio.raw` files written by `../example/ivf_mp3_to_raw.exs`
(`xxd -s $((194400*100 + 480*120 + 160)) -l 160 video.raw` and `xxd -s 176400 -l 12 audio.raw`),
and the sizes in `10-terminal` are the measured sizes from `../notes/facts.md`. The 6 × 4 picture
in `02-rows`, the four colours in `03-rgb`, the plane shading in `04-i420` and the wave in
`05-samples` are drawn, not taken from the clip.

## Regenerating

Everything is drawn by `../graphics/render.cjs` (HTML and CSS, screenshotted with Playwright) on
top of `../../tools/overlays.cjs`. It uses the Playwright installed under `presentation/`:

```
cd presentation
NODE_PATH=node_modules node ../youtube/04-raw-audio-and-video/graphics/render.cjs
```

Add `--preview` to also regenerate `_preview/`.
