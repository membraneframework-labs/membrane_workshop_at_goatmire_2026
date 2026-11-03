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
| `01-player-1` … `01-player-6` | 0:00 | The video player drawn as boxes, data flowing top to bottom, built up in six steps, one per spoken step: "Read the file"; "Split into tracks"; "Decode video" on the left; "Decode audio" on the right; "Screen"; "Speakers". `-6` comes back at 1:25 |
| `02-processes` | 2:15 | The same six-box drawing, every box carrying its own `#PID<0.10x.0>` line: each element is a separate process |
| `03-three-kinds` | 2:40 | Source, Filter and Sink stacked top to bottom, inputs and outputs drawn as arrows (in from above, out below), a two-line caption to the right of each tile |
| `04-pads` | 3:15 | Two elements (MP3 decoder, Audio sink) joined by one link; the `output` and `input` pads named, "uncompressed audio" written on the link |
| `05-plugins` | 3:55 | The `membrane_core` box (navy, captioned "runs pipelines, elements and pads") and a labelled frame of plugin cards next to it: file, MP4, H.264, WebRTC, and a dashed "…" card |
| `06-pipeline-1` … `06-pipeline-4` | 4:35 | The example pipeline, three tiles top to bottom: File source, MP3 decoder, Audio sink. `-1` plain, then each tile highlighted in turn (highlighted element filled navy, the rest dimmed), one per sentence |
| `07-takeaway` | 7:20 | The takeaway sentences |

`_preview/` holds the alternatives for `02-processes` (A: the boxes with a PID line each, the one in
use; B: the boxes replaced by the circles from the workshop slide) and for `03-three-kinds` (A: vertical
arrows, the one in use; B: horizontal arrows); delete it once decided.

Code snippets are not here on purpose: they come from the Keynote presentation. No licensed
material is used; everything is drawn from HTML and CSS.

## Regenerating

Everything is drawn by `../graphics/render.cjs` (HTML and CSS, screenshotted with Playwright)
on top of `../../tools/overlays.cjs`. It uses the Playwright installed under `presentation/`:

```
cd presentation
NODE_PATH=node_modules node ../youtube/03-membrane-basics/graphics/render.cjs
```

Add `--preview` to also re-render `_preview/`.
