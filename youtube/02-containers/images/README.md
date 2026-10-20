# Episode 02 · overlay graphics for post-production

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
| `01-ffprobe` | 0:00 | The ffprobe output for the MP4 file as a terminal snippet, "h264" and "aac" highlighted |
| `02-bytes-1` … `02-bytes-4` | 0:40 | A strip of bytes: plain, then frame boundaries, then timestamps, then track colours |
| `03-codec-vs-container` | 1:30 | Two cards: codec = how the media is compressed, container = how the streams are packaged |
| `04-three-containers` | 1:55 | Three cards: MP4, IVF, MP3 |
| `05-ivf-header` | 1:55, IVF | The first 48 bytes of the IVF file, fields coloured and decoded (480×270, 25 fps, 812 frames, first frame 281 bytes) |
| `06-mux` | 3:15 | H.264 and AAC streams merging into an MP4 muxer, MP4 out |
| `07-interleaved` | 3:15 | The MP4 drawn as alternating video and audio chunks with second marks |
| `08-demux` | 3:50 | MP4 into an MP4 demuxer, H.264 and AAC out, each to a decoder |
| `09-two-shapes` | 4:10 | H.264 with parameter sets in the stream vs stored once in the MP4 header (avc1) |
| `01-ffprobe-entries` | 4:50 | The same ffprobe snippet, "avc1" and "mp4a" highlighted |
| `10-pipeline-1` … `10-pipeline-4` | 5:05, 5:35 | The pipeline diagram, then the IVF deserializer, the MP4 muxer and the MP3 source highlighted in turn |
| `11-takeaway` | 7:15 | The takeaway sentences |

Code snippets are not here on purpose: they come from the Keynote presentation. No licensed
material is used; the ffprobe lines are condensed from a real run on `assets/bbb_h264_aac.mp4`
and the IVF bytes are the real first bytes of `assets/bbb_vp8.ivf`.

## Regenerating

Everything is drawn by `../graphics/render.cjs` (HTML and CSS, screenshotted with Playwright)
on top of `../../tools/overlays.cjs`. It uses the Playwright installed under `presentation/`:

```
cd presentation
NODE_PATH=node_modules node ../youtube/02-containers/graphics/render.cjs
```
