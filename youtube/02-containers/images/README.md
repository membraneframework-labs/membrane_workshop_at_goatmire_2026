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
| `04-inside-the-file-1` … `04-inside-the-file-3` | 1:55 | Three files appear one by one: movie.mp4 (MP4 container with an H.264 and an AAC track), video.ivf (IVF container with one VP8 track), song.mp3 (bare MP3 stream, dashed "no container" frame) |
| `05-ivf-header` | 1:55, IVF | The first 48 bytes of the IVF file, coloured as three parts: the 32-byte file header, the 12-byte frame header (size, timestamp), the start of the first frame. Nothing is read aloud |
| `06-mux`, `06-mux-vertical` | 3:10 | H.264 and AAC streams merging into an MP4 muxer, MP4 out; horizontal and vertical versions, pick one |
| `07-interleaved` | 3:10 | The MP4 drawn as alternating video and audio chunks with second marks |
| `08-demux`, `08-demux-vertical` | 3:50 | MP4 into an MP4 demuxer, H.264 and AAC out, each to a decoder; horizontal and vertical versions, pick one |
| `09-two-shapes` | 4:15 | H.264 with parameter sets in the stream vs stored once in the MP4 header (avc1) |
| `01-ffprobe-entries` | 4:50 | The same ffprobe snippet, "avc1" and "mp4a" highlighted |
| `10-pipeline-1` … `10-pipeline-3` | 5:15, 5:45 | The pipeline diagram, data flowing top to bottom, video branch left and audio branch right; then the IVF deserializer and the MP4 muxer highlighted in turn (highlighted element filled navy, the rest dimmed) |
| `11-takeaway` | 7:05 | The takeaway sentences |

`_preview/` holds alternative highlight styles for the pipeline (A: navy fill only, B: dim the rest only, C: both, the one in use); delete it once decided.

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
