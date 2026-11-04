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
| `01-hexdump` | 0:00 | 160 real bytes of a raw I420 frame (the unscaled 480 × 270 `video.raw` of an earlier run, frame 100, a row through the title card) as a plain hex dump: offsets on the left, nothing coloured, nothing to read |
| `02-rows-1` … `02-rows-3` | 0:45 | A frame of 24 pixels drawn as plain squares, each numbered by its position in memory (0 to 23): as one long strip ("each square is one pixel"), then folded into rows of six, then pixel 15 found by skipping two full rows (bracket on the right, "skip 2 full rows") and moving three along the third (bracket underneath, "then 3 along the row"), the rest dimmed, caption "pixel 15" |
| `03-rgb` | 1:25 | The two by two RGB frame ("the picture"), its pixels lettered A to D, and under it the same frame in memory ("the same frame in memory"): a dashed strip with the twelve bytes grouped in threes under the letter and colour of their pixel, tinted red, green, blue, each with its decimal value and its byte position 0 to 11; key "red · green · blue" |
| `04-i420` | 1:50 | A 6 × 4 picture (sky, sun, ground; "the picture"), and under it the same frame in memory as I420: a dashed strip with the three planes one after another, Y as 24 grey cells ("Y · brightness", "24 bytes"), U and V as 3 × 2 block-sized cells in the colours a video tool shows them ("U · colour" / "V · colour", "6 bytes"); caption "1.5 bytes per pixel on average" |
| `05-samples` | 2:40 | A smooth wave over a light baseline, dots at regular intervals, four of them labelled with their sample value (a peak, a point on the slope, a trough, one more); no caption |
| `06-interleaved` | 3:05 | Six real 16-bit samples of `audio.raw` (one second in), each as two bytes, labelled L, R, L, R, L, R; captions "one sample = 2 bytes", "stereo, interleaved" |
| `07-sentence` | 3:50 | Text card: "Raw data doesn't describe itself." (same style as episode 01's `11-raw-in-the-middle`) |
| `08-stream-format` | 4:25 | The two real stream format structs as formatted, syntax-coloured code on two dark panels of equal size: `%Membrane.RawVideo{width: 480, height: 270, framerate: nil, pixel_format: :I420, aligned: true}` and `%Membrane.RawAudio{sample_rate: 44_100, sample_format: :s16le, channels: 2}` |
| `09-pipeline` | 5:20 | The pipeline, data flowing top to bottom, one chain: File.Source, IVF.Deserializer, Transcoder "VP8 → raw video", Scaler "480 × 270 → 160 × 90", Transcoder "raw video → H.264", MP4.Muxer, File.Sink, with the input file above and the output file below drawn as dashed stream shapes |
| `10-terminal` | 7:00 | One dark terminal panel: `ffprobe -hide_banner small.mp4`, condensed to the input, duration and stream lines (bitrates left out), with `h264` and `160x90` highlighted |
| `11-takeaway` | 7:00 | The takeaway card: "Raw data doesn't describe itself." and, lighter, "In Membrane, that's the stream format." |

`_preview/` holds `03-rgb-B-one-pixel` (an alternative for `03-rgb`: a single pixel and its three
bytes) and `08-stream-format-B-stacked` (the two structs one above the other instead of side by
side, twice as large on screen); delete it once decided.

Code snippets are not here on purpose: they come from the Keynote presentation. No licensed
material is used. The hex bytes in `01-hexdump` are real bytes of a full-size decoded frame and
the sample bytes in `06-interleaved` are real bytes of raw audio, both from an earlier run of a
pipeline that wrote the unscaled video and the audio to files (
`xxd -s $((194400*100 + 480*120 + 160)) -l 160 video.raw` and `xxd -s 176400 -l 12 audio.raw` on
those files). The ffprobe lines in `10-terminal` are the real output for the MP4 that
`../example/ivf_scale_down.exs` writes (`../notes/facts.md`, section H). The 6 × 4 picture and
the plane colours in `04-i420`, the four colours in `03-rgb` and the wave in `05-samples` are
drawn, not taken from the clip.

## Regenerating

Everything is drawn by `../graphics/render.cjs` (HTML and CSS, screenshotted with Playwright) on
top of `../../tools/overlays.cjs`. It uses the Playwright installed under `presentation/`:

```
cd presentation
NODE_PATH=node_modules node ../youtube/04-raw-audio-and-video/graphics/render.cjs
```

Add `--preview` to also regenerate `_preview/`.
