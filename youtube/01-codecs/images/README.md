# Episode 01 · overlay graphics for post-production

Everything here is meant to be placed into the frame next to the presenter, not shown full
screen. The PNGs are cropped to their content, have a transparent background, and are rendered
at 2× so they stay sharp when scaled down. Two variants of every graphic:

- `on-card/` – on a white rounded card with a soft shadow. Works on any video background.
- `no-card/` – bare, navy on transparent. For light backgrounds or your own card.

Numbers follow the order in `../scenario.md`; the time column is the stage direction the graphic
belongs to. A `-1`, `-2`, … suffix means build-up steps of one graphic: all steps have the same
size, so cut from one to the next as the line is spoken and nothing jumps.

| File | Script time | What it is |
|---|---|---|
| `01-math-1` … `01-math-4` | 0:00 | The arithmetic, one line added per step |
| `02-codec-diagram` | 0:45 | raw media → encoder → coded stream → decoder → raw media |
| `03-compression-ratio` | 1:00 | 187 MB/s → 0.5 MB/s, almost 400 times smaller |
| `04-three-tricks-1` … `04-three-tricks-3` | 1:15 | The three tricks, one line added per step |
| `05-sky.png` (top level, 1920×1080) | 1:15, trick 1 | A plain blue sky with a few soft clouds. Generated, no licence |
| `07-codec-names` | 2:00 | Video and audio codec names, two cards |
| `08-transcoding-video` | 2:45 | VP8 → VP8 decoder → raw video frames → H.264 encoder → H.264, boxed as "transcoding" |
| `09-transcoding-audio` | 2:45 | MP3 → MP3 decoder → raw audio samples → AAC encoder → AAC |
| `10-transcoding-both` | 2:45 | Both diagrams stacked |
| `11-raw-in-the-middle` | 3:05 | Text card: "In the middle, you hold raw media." |
| `12-pipeline-of-elements` | 3:25 | file source → decoder → encoder → file sink, with a caption |
| `13-transcoder-is-the-box` | 3:25 | The audio transcoding diagram with the box labelled `Membrane.Transcoder` |
| `14-takeaway` | 4:30 | The two takeaway sentences |

There is no `06`: the motion-vector frame was dropped. Code snippets are not here on purpose:
they come from the Keynote presentation.

## Regenerating

Everything is drawn by `../graphics/render.cjs` (HTML and CSS, screenshotted with Playwright).
It uses the Playwright installed under `presentation/`:

```
cd presentation
NODE_PATH=node_modules node ../youtube/01-codecs/graphics/render.cjs
```
