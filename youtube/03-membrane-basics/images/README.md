# Episode 03 · overlay graphics for post-production

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
| `01-player-1` … `01-player-6` | 0:00 | The video player drawn as boxes, data flowing top to bottom, built up in six steps: "Read the file"; "Split into tracks"; "Decode video" on the left and "Decode audio" on the right (both on "decodes each track", in quick succession); "Screen"; "Speakers". `-6` comes back at 2:15 |
| `02-membrane-runs-it` | 1:30 | The six-box player graph inside a frame labelled "Membrane runs it" |
| `03-pipeline-and-elements` | 2:30 | The same graph inside a frame labelled "pipeline", with one box tagged "element" |
| `04-three-kinds` | 2:45 | Source, Filter and Sink stacked top to bottom, inputs and outputs drawn as arrows (in from above, out below), no captions |
| `05-pads` | 3:25 | Two elements stacked (MP3 decoder above Audio sink), joined by one vertical link; the `output` pad square on the bottom edge of the decoder and the `input` pad square on the top edge of the sink, named beside the link; "uncompressed audio" written next to the link |
| `06-plugins` | 4:00 | The `membrane_core` box (navy, captioned "runs pipelines, elements and pads") and a frame labelled "plugins, usually one package per domain" next to it with the cards "File plugin" (file source · file sink), "MP4 plugin" (muxer · demuxer), "H.264 plugin", "WebRTC plugin" and a dashed "…" card |
| `07-pipeline-1` … `07-pipeline-4` | 4:35 | The example pipeline, three tiles top to bottom: File source, MP3 decoder, Audio sink. `-1` plain, then each tile highlighted in turn (highlighted element filled navy, the rest dimmed), one per sentence |
| `08-takeaway` | 7:25 | The takeaway sentences |


Code snippets are not here on purpose: they come from the Keynote presentation. No licensed
material is used; everything is drawn from HTML and CSS.

## Regenerating

Everything is drawn by `../graphics/render.cjs` (HTML and CSS, screenshotted with Playwright)
on top of `../../tools/overlays.cjs`. It uses the Playwright installed under `presentation/`:

```
cd presentation
NODE_PATH=node_modules node ../youtube/03-membrane-basics/graphics/render.cjs
```

