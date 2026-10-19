# Multimedia with Membrane 101 — YouTube series

Series plan and scripts. The knowledge comes from the Goatmire 2026 workshop materials
(`presentation/slides.md`, the `DEEP_DIVE.md` files in `materials/`), but the series is not
the workshop: no tasks, no exercises, no project built across episodes. Each episode explains
one thing and stands on its own.

Every episode has its own file in this directory, always in two versions:

- **Version A (detailed)**: a full script with timing, spoken lines and what should be
  on screen. Read it 1:1 or lift specific phrasings from it.
- **Version B (room for you)**: a beat sheet. The order of points, the facts that must land,
  2-3 hook options and spots marked `[YOU: ...]` where your own story, opinion, joke or
  digression goes. For recording off the cuff.

Everything in these files is in English; the spoken lines are the blockquoted paragraphs.

## Concept

- **One episode = one thing.** Either one multimedia concept or one piece of Membrane.
- **Multimedia first, Membrane second.** Where an episode covers a multimedia concept, the
  first part is true regardless of tool (that's the part someone will google), then a short
  "In Membrane" segment shows how the concept appears in the framework. Membrane episodes
  open with the general idea too (a pipeline is a graph, backpressure is a general problem)
  before going into the Membrane specifics.
- **Explain through finished examples, not exercises.** Every Membrane segment reads through
  one small, complete piece of code: a spec, a filter, a switcher. The viewer reads along;
  nobody types, nothing is "left for you to finish". No checkpoints, no "our solution",
  no "last episode we built".
- **Content marketing without selling.** Membrane shows up as "and this is how it looks in
  practice", not as a product. One CTA at the end: repo + star + next episode.
- **Self-contained episodes.** Cross-references ("timestamps are episode 7") are fine, dependencies
  are not. Someone landing on episode 8 from search must be able to follow it.

## Episode skeleton

| Time | Block | Notes |
|------|-------|-------|
| 0:00-0:20 | **Cold open** | A question, a number or a 3-second clip before the logo. No "hi guys, welcome back". |
| 0:20-0:25 | **Series bumper** | 3-5 s: Membrane logo + "Multimedia with Membrane 101 · Ep. N". Same every time. |
| 0:25-0:45 | **Promise** | One sentence: what the viewer will know after this episode. |
| ~60% | **The concept** | Diagrams, analogies, one concrete numeric example. |
| ~30% | **In Membrane** | One finished example, read through. Snippet or short clip. |
| last 30 s | **Takeaway + next** | One sentence to remember, teaser of the next episode, repo link. |

## Episode list

| # | File | Working title | Kind | Length | Source |
|---|------|---------------|------|--------|--------|
| 00 | `00-intro.md` | Multimedia with Membrane 101 (series intro) | TRAILER | 1-2 min | |
| 01 | `01-codecs/scenario.md` | Why raw video doesn't fit anywhere: codecs | CONCEPT | 6-7 min | Ch. 1 slides "Codecs", "Transcoding" |
| 02 | `02-containers/scenario.md` | MP4 is not a video format: containers, muxing, demuxing | CONCEPT | 5-6 min | Ch. 1 slides "Containers", "Muxing and demuxing" |
| 03 | `03-membrane-basics/scenario.md` | Media processing is a graph: elements, pads and plugins | MEMBRANE | 5-6 min | Ch. 1 slides "Membrane in one slide", "Three kinds of elements" |
| 04 | `04-describing-a-pipeline/scenario.md` | Describing a pipeline in code: callbacks, actions and the spec | MEMBRANE | 6-7 min | Ch. 1 slides "Pipelines" … "Knowing when to stop", DEEP_DIVE Ch. 1 "Pipelines" |
| 05 | `05-raw-video/scenario.md` | What a video frame looks like in memory | CONCEPT | 5-6 min | Ch. 2 slides "Raw video and RGB", "Color inversion", DEEP_DIVE Ch. 2 |
| 06 | `06-writing-an-element/scenario.md` | Anatomy of a Membrane element: pads, callbacks, buffers | MEMBRANE | 6-7 min | Ch. 2 slides "Defining own Elements" … "handle_buffer", DEEP_DIVE Ch. 2 "Creating elements", BONUS (callback context) |
| 07 | `07-timestamps/scenario.md` | PTS, DTS and why your video plays too fast | CONCEPT | 6-7 min | Ch. 3 slides "Timestamps" … "Offline and online processing", DEEP_DIVE Ch. 3 "Timestamps" |
| 08 | `08-flow-control/scenario.md` | Backpressure: who sets the pace in a media pipeline | CONCEPT+MEMBRANE | 6-8 min | Ch. 3 slides "Flow control" … "Demand and redemand", DEEP_DIVE Ch. 3 "Flow control" |
| 09 | `09-reading-a-real-element/scenario.md` | Reading a real element: switching between two streams | MEMBRANE | 7-8 min | Ch. 3 slides "Task 3.2" hints, `lib/stream_switcher.ex` on `chapter-3-checkpoint` (as a finished example to read) |
| 10 | `10-webrtc/scenario.md` | WebRTC in 6 minutes: signaling, ICE, RTP | CONCEPT | 5-6 min | Ch. 4 slide "WebRTC", DEEP_DIVE Ch. 4 "WebRTC" |
| 11 | `11-live-streams/scenario.md` | Why live streams are different: pace, push and the toilet | CONCEPT+MEMBRANE | 5-7 min | DEEP_DIVE Ch. 4 "Live streams", Ch. 4 BONUS hints (toilet) |
| 12 | `12-composing-pipelines/scenario.md` | Bins, dynamic pads and notifications: composing pipelines | MEMBRANE | 6-7 min | Ch. 4 slides "Bins", "Boombox", "Child notifications", Ch. 1 BONUS hints (dynamic pads, `:new_tracks`) |

CONCEPT = a multimedia concept, true regardless of tool, with a short Membrane segment.
MEMBRANE = a piece of the framework, opened with the general idea behind it.

## Publishing order

Playlist in numeric order. CONCEPT episodes (01, 02, 05, 07, 10) are the search-traffic
entry points. MEMBRANE episodes refer back to them in one sentence and a card on screen,
they don't repeat the theory.

If publishing weekly, a good pairing is a CONCEPT episode on Monday and the related MEMBRANE
one on Thursday (01+02 → 03+04, 05 → 06, 07+08 → 09, 10 → 11+12).

## Inspirations (style, not content)

- **Fireship "… in 100 seconds"**: cold open with no preamble, one concept, dense, zero filler.
  We take the pace and the cuts, not the length (ours are 5 min, not 100 s).
- **ByteByteGo**: every concept gets one diagram that stays in your head. The mermaid diagrams
  from the slides are ready (transcoding, mux/demux, pipeline graph).
- **Computerphile**: someone who knows the subject explains it at a sheet of paper. Authenticity
  over production. A good model for Version B.
- **Hussein Nasser**: "why" before "how", conversational, not afraid to say "this is where it gets
  weird". A good model for episodes 07 and 08.
- **Low Level Learning / Code Aesthetic**: a hexdump as a picture, showing the bytes. Episode 05.
- **Elixir channels (Elixir Mentor, Elixir Streams)**: reading real code on screen, calmly. The
  Membrane segments.

## Production: what already exists

- **Slides**: `presentation/slides.md` (Slidev). Each episode names the slides it draws on. The
  "Hands-on", "Task" and "Our solution" slides are not used.
- **Diagrams**: mermaid in the slides, `presentation/public/i_p_and_b_frames.svg` (episode 07).
- **Example code**: the `chapter-N-checkpoint` branches hold finished versions of every example
  used in the scripts (the transcoding spec, `ColorInverter`, `StreamSwitcher`, the Boombox
  pipeline). They're used as something to show on screen, never referred to by name in the videos.
- **Assets for demo clips**: Big Buck Bunny (`bbb_vp8.ivf`, `bbb.mp3`), 480×270 at 25 fps,
  32 s. CC BY 3.0 (Blender Foundation), credit in the description.
- **Tools for showing results**: `ffplay`, `ffprobe`, `xxd`, an SDL window, a browser tab.

## YouTube metadata (template)

- **Title**: the phrase someone types + the promise. "What is a video codec? H.264, VP8, AAC
  explained (Multimedia 101 #1)". Series number at the end, not the start.
- **Description**: 2 sentences on what, then chapters with timestamps (YouTube turns them into
  chapters), repo link, previous and next episode, membrane.stream. Big Buck Bunny credit.
- **Pinned comment**: repo link.
- **Thumbnail**: one object + 3-4 words. E.g. episode 02: a file icon with "MP4 ≠ codec".
- **Cards / end screen**: always the next episode + the playlist.

## How to work with this directory

Layout: `00-intro.md` is a single file. Every other episode is a directory, `NN-slug/`, with the
script in `scenario.md` and, optionally, resources used in that episode next to it (diagrams,
screenshots, sample code, exported slides).

1. Read Version A of an episode to see the full flow and check the facts.
2. Record from Version B. If you don't know what to say at some point, Version A has a ready sentence.
3. Every episode has a "Facts that must land" section. That's the checklist for editing.
