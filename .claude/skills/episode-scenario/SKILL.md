---
name: episode-scenario
description: Write, revise or review a script ("scenario") for an episode of the "Multimedia with Membrane 101" YouTube series in youtube/. Use for a new episode, for applying the author's inline {comments}, for a style pass, or for producing an episode's overlay graphics. Encodes the author's voice rules, fact-checking protocol, review loop and graphics pipeline.
---

# Episode scenario skill

You are preparing or revising a script for one episode of **Multimedia with Membrane 101**, a
YouTube series by a Membrane Framework developer (Software Mansion). The author records from
these scripts on camera, a video editor cuts the result, and the graphics you produce get pasted
next to the author's head. The scripts live in `youtube/NN-slug/scenario.md`.

Everything in this file was learned the hard way on episode 01. Follow it closely. Where the
author's past decisions are quoted, they are decisions, not suggestions.

**The reference episodes are `youtube/01-codecs/` and `youtube/02-containers/`.** Both are approved.
Read their `scenario.md`, `images/README.md` and `graphics/render.cjs` before writing anything, and
`youtube/02-containers/notes/facts.md` to see what a fact sheet looks like. Episode 02 is the newer
of the two and shows the current graphics conventions (vertical pipelines, dimmed highlights, the
file-anatomy build-up); where the two differ, follow 02.

---

## 0. What the author wants in a transcript, distilled

This section is the synthesis of every reaction the author had while episodes 00 to 03 were
written: what they rejected, what they rewrote by hand, what they accepted without a word. Read it
before drafting. The goal is a first draft they can record with only small edits. Sections 1 to 11
hold the full rules; this is the shape of the target.

**The sound.** A knowledgeable colleague explaining something across a desk, in full sentences, at a
calm pace. Not a YouTuber, not a lecturer, not a copywriter. The author rewrote or deleted, every
single time, anything that sounded performed: short punchy fragments, dramatic pauses written as
sentence breaks, "here's the thing", "that's it", "the one thing to remember", lists of three for
rhythm, clever closers. They kept and wrote themselves: slightly loose sentences joined with
"and", "so", "because"; "a bunch of short videos"; "you give it X, it gives you back Y". But not long
ones: they record these lines on camera and asked to "avoid extra long sentences, put `.`s somewhere".
Keep a spoken sentence at about 25 words or fewer and split anything over 30. Their own
hand-written lines are the best calibration: *"We will present you a bunch of short videos, each
explaining a single idea."* *"Now, let's build this pipeline in Membrane."* *"repackaging is quick,
re-encoding not at all."* Plain, direct, a little informal, never ornamental.

**Exactly one emphasised sentence per episode**, the idea the episode exists for ("In the middle, you
hold raw media." / "MP4 is not a codec." / "You describe the graph, and Membrane runs it."). Everything
else at the same level. If a draft has three sentences that want to be remembered, it has zero. Speak
it once in its clean form, with no clause spliced into it, and put the same words on the takeaway
card, where it is the heavier of the two lines. In a MEMBRANE episode the sentence is about what
Membrane does for you, not about an implementation detail.

**No cold open that performs.** The author on the first cold open of 03 (a staccato list of what a
player does, closing on "almost every piece of multimedia software is built this way"): *"it sounds
bad, as if somebody tried too hard to sound cool, without saying anything valuable."* A cold open is
two to four plain sentences that make a point the episode then earns. Say why the thing matters
inside the open, not just that it exists. No universal claims ("almost every piece of software").

**Vocabulary the viewer can carry.** Say "Membrane" often ("Membrane elements", "a Membrane
callback"), the author added it by hand in four places. One word per thing across the whole
episode: the author chose "graph" over "drawing", "diagram" and "node", and rejected "one line per
box" because a child can span more lines in another pipeline (say "one call for each box"). No
Elixir-specific vocabulary unless the episode is about it: the audience may not know Elixir, so no
"process", "PID", "mailbox", "GenServer"; say "every element runs independently of the others, and
Membrane and Elixir take care of the concurrency". No competitor frameworks by name (GStreamer was
removed on sight); a ready-made tool like FFmpeg may be named once, as the thing whose flags are no
longer enough, which is the one sentence of "why Membrane" the author wants.

**What Membrane is gets a paragraph, early.** In the first MEMBRANE episode, and in any episode where
Membrane carries more than a closing example, a short paragraph right after the intro says what it
is: an open-source framework for this kind of software in Elixir, a library you add to your project,
you describe the graph and Membrane runs it (starts every step, moves the data, tells you when
something happens), and one sentence on why: a pipeline customised exactly to your needs, for the
cases where a ready-made tool is not enough. The author moved it there themselves and wrote the last
two sentences. In CONCEPT episodes the two-sentence version from episodes 01 and 02 is enough.

**What the author rewrote by hand in 03** (the calibration for the next draft): they moved the
"what Membrane is" paragraph to right after the intro and added its "why" ("Its advantage is that
you can build a pipeline customised exactly to your needs. That matters in non-standard cases, where
fiddling with the flags of a ready-made tool like FFmpeg isn't enough anymore."); they replaced
clever precision with plain statements ("every sample has already been handed to it and nothing more
is coming" became "all the elements we spawned are done with their processing"; "Actions are simply
instructions for the framework"); they named things fully ("the file source", "Each Membrane
callback", "Where do Membrane elements come from"); they preferred "where a stream is consumed" and
"Sinks might, for example, save the stream to a file or pass it to the speakers" over terser forms;
they credited concurrency to "Membrane and Elixir" without naming processes; and they made the
sign-off its own paragraph. Prompted changes in the same round: plain cold open with the point
inside it, no GStreamer, graph as the one word, sentences under 30 words, vertical three-kinds
overlay with arrows and no captions, pads overlay vertical to match, a what-Membrane-is paragraph.

**Fewer rules, fewer asides.** In 03 the author cut, one by one: the dangling-pads rule, the
optional-pads clause, "the name filter is misleading", the muxer/demuxer gloss, "with an error naming
the pad", the three format examples on a pad, the chunk-by-chunk dataflow term, the meta line "that's
enough to read a pipeline like the one we just saw". Keep only the rules the example on screen needs.
A MEMBRANE episode explains what the viewer sees in the code and nothing the code does not show.

**Every sentence must be true as stated, at the level of a specialist listening.** The author
catches every over-generalisation and category slip within seconds: "that makes the codec lossy"
(most codecs), "none of these are files" (MP3 is), "MP3 is a container" (it is a codec), "most
plugins wrap FFmpeg" (not true), "the header is 281 bytes" (the frame is), "every media player reads
the table" (not for IVF or MP3). They prefer a narrower true claim over a wider catchy one, and they
add the hedge themselves when it is missing ("usually", "almost every device", "where you usually
work"). When a claim is only true most of the time, say "most" or "usually"; when it is a
simplification, say what it hides in one clause.

**Firm, not soft.** The fix for an overclaim is a precise claim, not a hedge. "That's all you need
to know" was rejected as untrue; "should make sense" was rejected as *"too soft"*; "That's the core
of what containers do, and it's enough to read a pipeline like this one" was accepted. Say exactly
as much as is true, with confidence.

**Detail budget.** A fact gets airtime only if it carries the point or comes back later. The author
cut the IVF header field-by-field reading (*"we do not reuse this knowledge anywhere"*), the "last
two lines" reference in a takeaway (*"people will not remember them"*), the meta-summary of three
container options (*"does not sound good"*), the codec etymology (*"completely unimportant"*). Numbers
that carry the point stay (187 MB/s, half a percent, 32 bytes plus 12 per frame); numbers that
merely decorate go (480, 270, 812, 281). Structure over trivia, always.

**Concrete and current.** "Google Meet or Teams calls" rather than "video calls"; "running AI
inference on the frames" rather than "switching between streams"; "a blue sky is mostly the same
blue". Examples the viewer uses today, named by name.

**Nothing assumed, nothing promised.** The viewer has no multimedia background and may not have
seen any other episode: introduce every term when it first appears in this episode (encoder,
decoder, element, Transcoder, Membrane itself). No "you've probably seen", no "last episode", no
"repo", no "workshop". Endings don't promise the next topic; they close the loop on what was just
shown ("enough to read a pipeline like the one we just saw"), then "Thanks for watching, and see you
in the next episode."

**The Membrane part is a walk through one real, complete, runnable example**, top to bottom, one
sentence per line as it appears on the Keynote slide, never jumping around, never summarising
afterwards. It opens with one or two sentences saying what Membrane is. If the example hides a step
the concept part just explained (the Transcoder hides the raw media), say so briefly instead of
hoping nobody notices. The example must be something a professional would actually do (mux into a
container; don't dump raw H.264 into a file).

**Order and flow.** Concept first, in the order a newcomer needs it; one idea per paragraph; each
paragraph does one job and hands over to the next. The author called a section "chaotic" when it
mixed four ideas, and asked for enumerations to be spoken in the order they appear on screen. Where
the script says something is on screen, the spoken words follow the picture: same terms, same order,
same number of steps.

**Length.** 6 to 8 minutes of speech, 900 to 1,150 words. The approved episodes landed around 7
to 7.7 minutes and the author did not ask for cuts; they asked for cuts of *detail*, never of
explanation. When an added paragraph pushes the count over 1,150, cut detail elsewhere in the same
pass instead of handing over an eight-minute script.

**What they strip from the file.** The author deleted "Facts that must land", the duplicated code
blocks and most boilerplate from episode 01 once it was approved. Keep the file lean: the metadata
table, Version A with stage directions, Version B. Put code once, as the fenced block the slide is
made from.

**How they review.** Inline `{comments}` in the markdown, direct rewrites, deletions that must stay
deleted, and three recurring questions: "does it sound good?", "is it true?", "do we need this?". A
draft that already answers those three for every sentence is the target.

**First-draft checklist, before showing anything:**

1. Read every spoken paragraph aloud in your head. Anything you would not say to a colleague across
   a desk gets rewritten.
2. Find the one emphasised sentence. Flatten every other sentence that is trying to be it.
3. For every claim, ask whether a Membrane maintainer would wince. Narrow it until they wouldn't.
4. For every number and every name, ask whether it comes back or carries the point. If not, cut it.
5. Check that every term is introduced in this episode before it is used.
6. Check the opening promises what the episode delivers and the ending promises nothing. The
   sign-off is its own paragraph: "Thank you for watching, and see you in the next episode."
7. Check the code walkthrough goes line by line and ends on the last line.
8. Check that no spoken sentence is over 30 words and no line of the file is over 100 characters
   (the author reads the file in VS Code without wrapping; wrap stage directions too).
9. Run the lint, recompute the timestamps (`youtube/tools/retime.py`), re-sync the README times,
   and only then hand over.

---

## 1. What the series is, and is not

- **One episode = one thing.** One multimedia concept, or one piece of Membrane. 3 to 8 minutes
  of talking (10 is the hard ceiling), which is roughly 500 to 1100 spoken words at the author's
  pace of ~150 words per minute. Episode 01 is ~1000 words, 6.5 minutes. That is a good length.
- **Multimedia first, Membrane second.** The first and larger part explains the concept in a way
  that is true regardless of tool. Then a shorter "In Membrane" part shows how the same thing
  looks in the framework, through one complete, verified example.
- **Knowledge, not a project.** The source material is a workshop that built a pipeline across
  four chapters. The series does **not** build anything. No tasks, no exercises, no checkpoints,
  no "our solution", no "last episode we built". Never say "workshop" in spoken text.
- **Self-contained episodes.** The order may change and viewers land from search. An episode
  never depends on another. "Last episode we…" is banned. A one-clause teaser of a later topic
  ("that's a story for another episode") is fine. Naming the next episode's topic at the very end
  is fine ("In the next episode we'll look at containers").
- **The intro's promise binds every episode:** "every video starts with the concept itself, the part
  that holds no matter what language or tool you use, then how it looks in Membrane". So a MEMBRANE
  episode opens with its tool-independent idea (a media player is a graph of steps; backpressure
  is a general problem) before any Membrane vocabulary. Do not name other frameworks to make the
  point; the author removed GStreamer from 03 ("I would not mention GStreamer at all").
- **Detail budget.** A fact earns a sentence only if it carries the episode's point or is used again
  later. The author on reading an IVF header field by field: *"we do not reuse this knowledge
  anywhere"*. Show structure, don't recite numbers. When in doubt, cut the number and keep the shape.
- **Audience:** developers with **no multimedia background**. Some Elixir helps, but the viewer
  may never have heard of Membrane, H.264 or a container. Never write "you've probably seen…" or
  "as you know…". Introduce Membrane in one or two sentences the first time it is named in each
  episode. Audio counts as much as video.
- **Membrane is content marketing without selling.** It shows up as "this is how it looks in
  practice". No product pitch, no "star the repo". Do not mention "the repo" in spoken text at
  all: the viewer does not know any repo. Links go in the YouTube description, not in the script.

Sources of truth, in order of authority:

1. `presentation/slides.md` (Slidev deck of the workshop; the diagrams are drawn as Mermaid there).
2. `materials/Chapter N/DEEP_DIVE.md` (the long explanations), then `README.md` and `BONUS_TASKS.md`
   in the same folders. Use the knowledge, skip the tasks.
3. The finished workshop code on branches `origin/chapter-1-checkpoint` … `origin/chapter-4-checkpoint`
   (`lib/workshop_pipeline.ex`, `lib/color_inverter.ex`, `lib/stream_switcher.ex`). Read with
   `git show origin/chapter-N-checkpoint:lib/file.ex`. Never check them out.
4. The actual plugin source under `deps/` (run `mix deps.get` once if missing; `deps/` is
   gitignored). This is where you verify every module name, option and default.
5. `youtube/README.md`: the episode list with working titles, kind (CONCEPT or MEMBRANE), length
   target and which slides each episode draws on.

---

## 2. Voice: how the spoken lines must sound

This is the thing the author pushed back on most. The author is a non-native speaker who will
say these lines aloud, and asked for text that sounds like a person explaining something to a
colleague, not like a YouTube script.

**Write full, plain sentences in a conversational register.** One idea per sentence. Join
related points with "so", "and", "which", "because" instead of chopping them into fragments, but
stop joining before a sentence passes about 25 words. The author speaks every line on camera and
long sentences are hard to deliver; anything over 30 words gets a full stop somewhere. A
colon-joined definition ("X is Y: it does A, B and C") is usually two sentences.

**Banned, with the author's words:**

- The staccato "heavy" style: "Thirty frames a second. One hundred eighty-seven megabytes. Per
  second." The author: *"nobody speaks this way… if you try to underline everything, you underline
  nothing."* Let **one** sentence per episode carry weight (in 01 it is "In the middle, you hold
  raw media."). Everything else is plain.
- YouTuber tics: "here's the thing", "that's it", "and this is the one thing I want you to
  remember" (the author: *"not sure if it is true"*), two-word punches ("Co-dec. Coder, decoder.").
- Etymology and trivia asides. The author on "codec is short for coder-decoder": *"it is completely
  unimportant"*. If it doesn't move the explanation forward, cut it.
- Lists of three negations for effect ("not your disk, not your network, not your memory"): the
  author flagged this as "too AI-style". Say it once: "You can't store that, let alone stream it."
- Assuming knowledge: "you've probably seen the names". The audience hasn't.
- Claims that are shaky in 2026: "if you watched anything today it was probably H.264" (YouTube
  serves mostly VP9/AV1). Prefer claims that are safely true: "every device you own can decode it".
- Over-generalisations a specialist would wince at: "that makes the codec lossy" (some codecs are
  lossless → "most codecs"), "none of these are files" (MP3 is both), "play it" as something you do
  *between* decoder and encoder.
- Mixed register inside one explanation: don't say "coder-decoder" and then switch to "encoder".
  Pick the term the rest of the episode uses and introduce it once. Same for "entry" vs "box":
  one word per thing, in the script and on the graphics.
- Category errors, in text and in graphics alike: MP3 is a codec, not a container; the Transcoder is
  a component, not an element; a file is not a stream. The author catches these every time
  ("MP3 AFAIK is not a container, it is a codec"). Never put different categories in one row of
  cards.
- Meta-closings after a code walkthrough ("Three options in this code are there only because of
  containers: …", "and now you know why each of them is there"). The author: *"it does not sound
  good"*. End the walkthrough on the last line of code and go to the takeaway.
- Words that are ambiguous when heard: "how long the frame is" (bytes or seconds?), "from the
  beginning" (of the file or of the episode?), "let's build" (the series builds nothing). Say
  "how big", "the file we started with", "let's look at how it's written".
- Introduce every term the first time it appears in **this** episode, even if episode 01 had it:
  encoder, decoder, Transcoder, element. Five words are enough ("a Transcoder, a component that
  re-encodes the stream").
- Flourishes that sound written: "Only then does it…", "What's interesting is that…", "almost line
  for line", "shipped in plugins". The author called the last two "too punchy". Say the plain
  version: "Then it…", "And none of those steps needs to…", "they come from plugins".
- Claims of independence that a specialist knows are not absolute: "none of those steps knows
  anything about the others" is false once audio and video must stay in sync. Say "needs to know
  how the others work inside" and "cares only about what comes in and what goes out".
- Formulations that depend on how the code happens to be formatted ("one line per box"); say what
  the code does ("one call for each box").

**Preferred shapes:**

- "You give it X, it gives you back Y" over "it takes X and turns it into Y".
- Concrete, everyday referents: "Google Meet or Teams calls" rather than "video calls" or "WebRTC"
  alone; "a blue sky is mostly the same blue".
- Walk through code **top to bottom, in order**, no jumping from the first line to the last line
  and back to the middle. The author: *"the pipeline description should go line by line"*.
- When a tool hides a step you just explained (the Transcoder hides the raw media in the middle),
  say so in two or three sentences rather than pretending it isn't there. Turn the apparent
  contradiction into the point.
- Build-ups: when a stage direction has lines appearing one by one, the spoken text should reach
  each line in order, with one short sentence per line.
- Don't refer to things the viewer will not remember. In the takeaway, don't say "those last two
  lines of the code": the viewer saw the code a minute ago and has forgotten it.

**Self-check before you hand anything over:** read every spoken paragraph aloud in your head as
a person talking to a friend. If a line would sound rehearsed, performed or clever, rewrite it.

---

## 3. The file: `youtube/NN-slug/scenario.md`

Approved structure, as in `youtube/01-codecs/scenario.md`:

```markdown
# NN · Working title

| | |
|---|---|
| Type | CONCEPT or MEMBRANE |
| Length | N-M min |
| SEO title | "The phrase someone types + the promise (Multimedia 101 #N)" |
| Keywords | 5-7 search phrases |
| Source | which slides and DEEP_DIVE sections this draws on |
| On screen | one sentence per graphic, pointing at images/ (see §6) and noting that code comes from the Keynote presentation |

---

## Version A (detailed)

**[m:ss] Stage direction in bold: what is on screen, which overlay file, how it builds up.**

> Spoken lines are blockquotes. Wrap at ~100 characters. One blockquote per thought, a blank line
> between thoughts.

**[m:ss] Bumper**

...

**[m:ss] Takeaway + next**

> One plain sentence that restates the thing, then one sentence naming the next topic.

**[m:ss] End**

---

## Version B (room for you)

**Hook, pick one:** 2-3 options, one line each.

**Beats:** numbered list of the points in order, with `[YOU: a prompt for the author's own
story, opinion or example]` where they fit.

**What not to do:** the depth limit for this episode (what belongs to another episode).
```

Notes on the structure:

- A **"Facts that must land"** section used to sit between the table and Version A. The author
  removed it from the finished episode 01. Write it while drafting (it is your checklist), and
  keep it in the draft you hand over; the author will delete it if they don't want it. Mark it
  clearly so a reviewer can check the spoken text against it.
- **Timestamps** in stage directions are estimates. Recompute them when text changes (~150 wpm).
- **Code:** the author shows code from a Keynote presentation, not from your graphics, and builds
  the spec **line by line as they speak**. Still put every snippet in the scenario as a fenced
  `elixir` block under its stage direction, because the author copies it into Keynote from there,
  and the reviewer needs it to check the walkthrough. Write the walkthrough so each sentence maps to
  the lines appearing at that moment, top to bottom, and say in the stage direction which opening
  sentences are spoken over the empty slide. The author may trim the blocks later; that is their call.
- **Stage directions are the editor's instructions.** Name the overlay file for every visual, say
  which spoken clause each build-up step follows, and when you cut away to a second graphic (a hex
  dump during a card build-up), say when to cut back. If two orientations of a graphic exist, say
  which one.
- The spoken text is **100% English**. No Polish anywhere in the file, not even in notes.
- Version A is recorded 1:1 or nearly so. Version B is the fallback for off-the-cuff recording.
  Version B must agree with Version A on facts and order.

---

## 4. Code examples and facts: the verification protocol

The author's standard is "exact, finished examples". A fragment is not an example. A snippet that
would not run is a bug in the script.

**Rules for examples:**

1. **Complete and runnable.** Source to sink. If an element needs an option to work (the MP3
   source needs `content_format: Membrane.MPEGAudio`; the MP4 muxer needs H.264 with
   `stream_structure: :avc1` and AAC with `config: :esds`), the option is in the snippet even if
   the episode doesn't explain it. One sentence can defer the explanation to another episode.
2. **Prefer the workshop's real code** from the checkpoint branches, simplified only by renaming
   or dropping unrelated parts. Never invent an element or option you haven't seen in `deps/`.
3. **Run the example.** `mix run` a script with the spec (the project compiles; `_build/` is
   gitignored) and `ffprobe` the output. On episode 02 this is how we learned the Transcoder's
   MP3 → AAC path produces mono, so the script could not call the result "stereo". A fact sheet
   that says "runs, terminates :normal, output probes as …" is worth more than any reading of the
   source.
4. **Verify every identifier against source.** For each module, option and default in a snippet:
   - `grep -rn "defmodule Membrane.X" deps/` to prove the module exists in the pinned versions.
   - open the file and check the option name, its type and default (`defstruct`, `def_options`).
   - for the Transcoder, `deps/membrane_transcoder_plugin/lib/transcoder/output_format.ex` and
     `audio.ex`/`video.ex` tell you what it accepts and what it builds inside.
   Record what you verified and where in the hand-over message. "I believe" is not verification.
5. **Verify numbers.** Arithmetic in the script must be recomputed. Asset facts come from
   `ffprobe assets/<file>` (the Big Buck Bunny clip is 480×270, 25 fps, 32-33 s; the MP4 asset is
   H.264 Constrained Baseline in `avc1` plus stereo AAC-LC). Do not say a clip is "ten minutes".
6. **Don't show things the author considers bad practice**, even if they work: e.g. writing a raw
   H.264 stream into a `.h264` file as the "result" of a pipeline. The author replaced that with
   MP3 → AAC in MP4. When in doubt, mux into a container.
7. **Name things at the level the viewer can hold.** `Membrane.Transcoder` is technically a Bin;
   the workshop calls it an element, the author calls it "a Membrane component". Use "component"
   for it and "element" for real elements. Don't introduce the word "Bin" before episode 12.

**The `example/` directory: a runnable demo of the slide code.** Every episode whose Membrane
part shows a pipeline gets `youtube/NN-slug/example/` with:

- one script, named after what it does, no suffix (`mp3_to_mp4.exs`, `ivf_mp3_to_mp4.exs`),
  runnable with plain `elixir <script>` from inside that directory, outside the Mix project;
- the input fixtures next to it, under the file names the slide code uses (`input.mp3`,
  `bbb_vp8.ivf`, `bbb.mp3`), copied from `assets/`;
- a `.gitignore` listing the output file the script writes.

The script is, top to bottom: `Mix.install` with the same three-component version requirements as
the root `mix.exs` (loose `~> 0.36` would drift to a breaking 0.x release; the Transcoder brings the
codec plugins transitively, file/ivf plugins must be listed); `Logger.configure(level: :error)` so
the terminal stays empty on camera (`:warning` shows one benign FDK encoder line, no configure at
all shows a thousand debug lines); a pipeline **module** (`use Membrane.Pipeline`, never
`RCPipeline`) whose `handle_init` returns the spec **byte for byte as on the slide**, including the
slide's line layout and child names, with straight quotes even if Keynote shows curly ones; two
`handle_element_end_of_stream` clauses, the sink's returning `terminate: :normal`, a catch-all
returning `{[], state}`; then `Membrane.Pipeline.start_link(Module)`, `Process.monitor` on the
pipeline pid and a `receive` for `:DOWN`. Nothing else: no comments, no options, no state beyond
`%{}`. See `youtube/01-codecs/example/mp3_to_mp4.exs` for the shape.

Before handing over: run each script from its directory, check exit 0 and an empty terminal, run
`ffprobe -hide_banner` on the output and confirm the streams the episode promises, then delete the
output. Tell the author to run each script once on the recording machine beforehand, because the
first `Mix.install` compiles native libraries for minutes; after that a run takes under a second.
Known quirk: the Transcoder's MP3 → AAC path produces mono from a stereo MP3 and there is no slide
level option to change it, so ffprobe will show "mono" on camera; the script must not pretend
otherwise.

**Facts already verified for this project** (reuse, don't re-derive):

- 1920 × 1080 = 2 073 600 px; × 3 B = 6.2 MB/frame; × 30 fps ≈ 187 MB/s; × 7200 s ≈ 1.3 TB.
  Half a megabyte per second is a fair "decent 1080p stream", ratio ≈ 370, say "almost 400 times".
- `Membrane.Transcoder.OutputFormat.H264` defaults to `stream_structure: :annexb, alignment: :au`;
  `OutputFormat.RawAudio{}` defaults every field to `:any`; `OutputFormat.AAC{config: :esds}` is
  what the ISOM muxer wants. For MP3 in, the Transcoder internally builds
  `Membrane.MP3.MAD.Decoder` → raw audio → `Membrane.AAC.FDK.Encoder`. It accepts MP3, AAC, Opus,
  raw audio in; VP8, VP9, H.264, H.265, raw video in.
- `Membrane.File.Source` with an MP3 file needs `content_format: Membrane.MPEGAudio` because MP3
  has no container to announce itself. `Membrane.IVF.Deserializer` unpacks VP8/VP9/AV1 from IVF.
  `Membrane.MP4.Muxer.ISOM` takes one or many tracks; `Membrane.MP4.Demuxer.ISOM` emits
  `{:new_tracks, …}` notifications.
- Pinned versions: `membrane_core ~> 1.3`, `membrane_file_plugin ~> 0.17`, `membrane_ivf_plugin
  ~> 0.9`, `membrane_transcoder_plugin ~> 0.5`, `membrane_mp4_plugin ~> 0.36`, realtimer, SDL,
  portaudio, raw audio parser (see `mix.exs`).
- Elements are Erlang processes. Pads carry `accepted_format`. Flow control: `:auto`, `:push`,
  `:manual`; the default toilet capacity is 200 buffers. `handle_element_end_of_stream/4` on the
  sink → `{[terminate: :normal], state}` is how the workshop pipeline stops.
- `Membrane.Transcoder` decodes and encodes internally, so raw media is never exposed; to get at
  it you use two Transcoders with your own element in between (that is how `ColorInverter` is
  wired on `chapter-2-checkpoint`).

---

## 5. The working loop: writer, reviewer, finisher

The author wants the best possible script and does not want to spend their own time. Tokens are
cheap compared to a review round with the author. Use this loop for a new episode and for any
revision larger than a few sentences. For a one-comment fix, just do it.

Run the roles as separate agents (the `Agent` tool, `subagent_type: "general-purpose"`), because a
reviewer who did not write the draft catches what the writer is blind to. Give each agent this
skill's path and the reference episode's path in its prompt, and tell it to read both first.

**Role 1, researcher (can be the writer, but do it as a separate step):**
produce a *fact sheet* for the episode: the concept in 10-15 plain statements, each with its
source (slide title or DEEP_DIVE heading), the numbers recomputed, the Membrane example chosen
and verified line by line against `deps/` and the checkpoint branch, and a list of things the
viewer is likely to misunderstand. Save it as `youtube/NN-slug/notes/facts.md` (keep it; it is
useful for the next revision).

**Role 2, writer:** draft `scenario.md` from the fact sheet, following §2, §3, §4. Then run
`python3 youtube/tools/check_scenario.py youtube/NN-slug/scenario.md` and fix every PROBLEM. Then
hand the draft to the reviewer.

**Role 3, reviewer (fresh agent, has not seen the draft being written):** reviews in three passes
and returns a numbered list of findings, each with the exact quoted line and a proposed
replacement. No summaries, no praise.

1. *As a first-time viewer:* someone with no multimedia background watching this cold. Where would
   they be lost, where does a term appear before it is explained, where does the script assume
   they remember something from three minutes ago, what sentence is unclear.
2. *As the author:* apply §2 line by line. Flag every fragment run, every tic, every aside, every
   claim that is only mostly true, every place the code walkthrough jumps around. Flag anything
   that sounds performed.
3. *As a Membrane maintainer:* check every module, option, default and claim against `deps/` and
   the checkpoint code. Check the arithmetic. Check that the example is complete and would run.

**Writer, second pass:** apply every finding or state in one line why not. Re-run the lint.

**Finisher (you, the main agent):** read the final script once more end to end, in one sitting,
as a viewer. Then produce the graphics (§6), the images README, and the hand-over message (§8).

**Expect several rounds.** Episode 02 took four review rounds: one on the first draft, then one
after each batch of the author's comments. Every round found real seams, always at the edges of
the latest edits (a stage direction that no longer matched a graphic, a sentence referring to a
line that had been deleted, a graphic rendered in a state nobody intended). So: after **any** batch
of piecemeal edits, text or graphics, run a fresh reviewer over the whole Version A plus the PNGs
before handing over. The author asks for this explicitly ("ensure the quality is good once again,
with the workflow"); do it without being asked.

**Give the reviewer the pictures.** The reviewer must open the overlays named in the stage
directions (the `Read` tool renders PNGs) and check that words and pictures agree: same terms,
same order, same number of build-up steps, nothing highlighted that the text doesn't mention.

**Graphics get their own review rounds.** After rendering, run a fresh reviewer over the PNGs alone
(with §6 and the stage directions), apply, re-render, and repeat until a round returns "no
findings". Episode 03 needed three rounds; the first two found clipped arrowheads, unequal tile
widths, a label running off the card, an empty second line on cards, and README rows that no longer
matched. A quick final round (lower effort) that only re-checks the last fixes closes the loop.

**The loop ends with "no findings", not with a tired writer.** Before the hand-over, one closing
reviewer pass over the whole Version A plus the pictures must come back empty or with nits only.
Then hand over. The author wants to be able to walk away and come back to a finished episode.

If any role is unsure about a fact, the answer is to open the source, not to soften the sentence.

---

## 6. Graphics for the editor

The editor pastes graphics **next to the author's head**, so they are overlays, not slides.

- **Format:** PNG, transparent outside the graphic, cropped to content, rendered at 2× (device
  scale factor 2). Two variants of every graphic: `images/on-card/` (white rounded card with a
  soft shadow, works on any background) and `images/no-card/` (bare navy on transparent).
- **Style:** Membrane colours (navy `#001a72`, blue `#87cce8`, soft `#e9f6fb`), DM Sans, the
  diagram vocabulary of the workshop slides: solid light-blue boxes for processing, dashed
  parallelograms for streams, a labelled frame around a group.
- **Build-ups:** when lines appear one by one, render one PNG per step with the same size, so
  nothing jumps when the editor cuts between them (`buildup()` and `numbered()` keep hidden lines
  in the layout).
- **No code graphics.** Code comes from the author's Keynote. Do not render code slides.
- **No licensed material.** No stills from Big Buck Bunny, no stock photos. If a photo-like
  element is needed (a sky, a texture), generate it (episode 01 draws its sky from fractal noise
  on a canvas). If something cannot be generated, say so and leave it to the author.
- **Full-frame images** (a generated background, a terminal screenshot you made) live at the top
  level of `images/`, 1920×1080, and are listed in the README with their size.

**Conventions settled on episode 02 (follow them):**

- **Pipelines are vertical.** Data flows top to bottom, the video branch on the left, the audio
  branch on the right, both merging into the muxer (`vchain`, `vmerge`, `vsplit` in the shared
  library). Horizontal pipelines were "too wide compared to the size of the letters". Tiles have a
  fixed height with the text vertically centred; every tile the same height; a second line
  (`Transcoder` / `VP8 → H.264`) only where it informs.
- **Highlighting a step:** the current element is filled navy with white text, everything else at
  70 % opacity (`.hlC`). No rings, no outlines; the author found both "not catchy enough" and then
  "even worse". The un-highlighted first step must **not** carry the dim style.
- **Show category differences.** A "what's inside the file" graphic (container frame holding track
  bars; a dashed "no container" frame for MP3) replaced three equal cards because the cards made MP3
  look like a peer of MP4 and IVF.
- **Hex dumps:** colour the structure (file header / frame header / data), three or four labels,
  no decoded numbers in the legend unless the script reads them out.
- **Terminal output** (ffprobe) is a dark rounded panel in JetBrains Mono, ligatures off, with the
  words the script points at highlighted in blue; condensed to the lines that matter, never
  invented.
- **Decisions the author will want to see, not read:** orientation, highlight style, how a concept
  graphic is composed. Render two or three variants into `images/_preview/` and let them choose.
  The author: *"I need to see it with my own eyes, instead of reading a description."* Never ask
  them to imagine a graphic.
- **Settled on episode 03:** every element tile is 360 CSS px wide (the `.vcol .box` width),
  in every overlay of the episode, so the same element looks the same at 3:15 and at 4:35. Inputs
  and outputs of an element are arrows (in from above, out below), not pad squares; pad squares
  appear only in the overlay about pads, placed exactly where the arrow stubs were. No captions or
  sublabels under tiles ("only outputs · starts the stream" was removed): a tile carries its name,
  nothing else. The card's left and right margins are equal (112 px at 2x); labels positioned
  absolutely add no width, so reserve the space they need with padding or the label runs off the
  card. The split and merge arrows need `overflow:visible` on their SVG (the shared library has it
  now) or the arrowheads are cut in half. The takeaway card has two lines, the emphasised sentence
  heavier (navy, 600) and the other muted. A graph inside a labelled frame (`.group.framed`) is the
  way to say "this whole thing is a pipeline" or "Membrane runs it"; tag one tile with a short
  leader line for "this is an element".
- **Verify renders at the pixel level.** Look at every PNG you produced. Check that all steps of a
  build-up have the same width and height (read the PNG header). After changing an opacity or a
  colour, confirm it landed (a sed that didn't match leaves the old PNG in place, which happened
  once). Card shadows and highlight rings need the padded wrapper the library provides.

**How:** every episode has `graphics/render.cjs`, a list of `[name, html]` pairs built with the
helpers in `youtube/tools/overlays.cjs` (`chain`, `box`, `stream`, `group`, `stack`, `buildup`,
`numbered`, `row`, plus the CSS classes `.huge`, `.big`, `.pills`/`.pill`, `.caption`, `.mono`),
passed to `render(graphics, outDir, extra?)`. Copy `youtube/01-codecs/graphics/render.cjs` as the
starting point. Run it from the presentation folder, which has Playwright installed:

```
cd presentation && NODE_PATH=node_modules node ../youtube/NN-slug/graphics/render.cjs
```

If `presentation/node_modules` is missing, run `npm install` there first. Look at the PNGs you
produced (the `Read` tool renders images) before declaring them done; check that nothing is
clipped, nothing overflows, text is not dimmed unless intended, and every step of a build-up has
the same size.

**File names:** `NN-what-it-is.png`, numbered in the order they appear in the script, with `-1`,
`-2` suffixes for build-up steps. Numbers may have gaps if a graphic is dropped; say so in the
README. **Stage directions in the script name the file** they refer to.

**`images/README.md`:** a table with file, script time and a one-line description, then a line
about variants, then the regenerate command. Copy the shape from episode 01.

---

## 7. Working with the author's comments

The author reviews by writing comments **inside the markdown**, in curly braces: `{like this}`,
sometimes spanning lines, sometimes next to a word, sometimes as a whole line with a proposed
rewrite. They may also delete sentences or rewrite lines directly without a comment.

- "Apply my comments" / "apply suggestion" / "implement them" means: find every `{…}` outside
  code blocks, do what it says, remove the braces. Use `git diff` to see what else they changed.
- **Never restore a sentence the author deleted.** The author: *"If I remove them, do not restore
  them."* When you rewrite a passage, start from the file as it is now, not from your last version.
- Where a comment asks a question ("WDYT about…?", "do we want…?"), answer it in the hand-over
  message and either apply the best reading or leave the text unchanged, as the question implies.
  Don't leave the braces in.
- Where a comment is a general concern rather than a concrete fix ("this sounds chaotic", "it is
  a high level concern"), respond with a short opinion and a light edit, not a rewrite of the whole
  section, unless asked.
- Lines the author wrote themselves may contain slips ("Trancoder", "out pipeline", "what is
  container yet"). Fix spelling and grammar in their lines silently, and list the fixes in one
  line of the hand-over message.
- **Always check the file on disk before concluding anything.** The author has an editor open and
  has, more than once, reverted the file by accident or saved a stale buffer. Use `stat -f "%Sm"`
  and `git diff` to see what is really there. If your changes were lost, re-apply them from the
  current file; don't assume the file is as you left it.
- Comments can arrive mid-turn. Address them in the same turn.
- **"Tell me before you make changes" / "wdyt" means propose, don't implement.** Answer with the
  options and a recommendation; for anything visual, render previews. Then wait.
- **The author edits the same file while you work.** Before every edit, normalise the blockquote
  wrapping and match on the joined text, not on line breaks; re-read the lines around your target
  if an exact match fails. Several edits were lost to this before the fix.
- **Re-time after every text change.** `python3 youtube/tools/retime.py youtube/NN-slug/scenario.md --write`
  recomputes the `[m:ss]` marks from the cumulative word count (150 wpm, 5 s bumper, rounded to
  5 s); then sync the times in `images/README.md`, the lint checks they agree.
- The author appreciates one-line corrections of their English in replies (they asked for it).
  Keep it to clear slips, one line, at the end, never preachy.

---

## 8. Hand-over message

The author reads only the final message. It must stand on its own, and it must be short: when a
message ran long the author answered *"so what is the point? I don't want to read your whole
response"*. Lead with the point in one sentence. One line per item after that.

1. What is done, in two sentences.
2. For a revision: one bullet per comment, what you did with it. For a new episode: the spoken
   word count and estimated minutes, and the list of graphics produced.
3. Decisions you made that the author might want to reverse (a mentioned codec, a dropped
   sentence, an example choice), each in one line with the alternative.
4. Anything you could not verify, with what you would need.
5. Do not commit unless asked. The author's shorthand "c p" means commit and push. Commits end
   with the `Co-Authored-By` trailer from the session's instructions. Write commit messages to a
   temp file and use `git commit -F` (heredocs with apostrophes break in this shell).
6. **Branches** (as of 2026-10-20): `main` holds the workshop only, no series material.
   `youtube-main` holds the intro, the skill and the tools. `youtube-01-and-02` holds the approved
   episodes 01 and 02 on top of `youtube-main`; PRs of finished episodes target `youtube-main`.
   `youtube-wip` is the author's working branch with all twelve episodes; that is where "c p" goes
   unless told otherwise. Never force-push without an explicit go-ahead; when a branch must be
   rebuilt (e.g. a PR shows only deletions because of a wrong merge base), explain and ask.

---

## 9. Lint and length

`python3 youtube/tools/check_scenario.py youtube/NN-slug/scenario.md` prints the spoken word
count and minutes, leftover `{comments}`, banned phrases (from §2), suspected staccato runs,
Polish characters, placeholders, and whether the times in `images/README.md` match the stage
directions. Exit code 1 means something blocking. Run it before every
hand-over; paste its first line (words and minutes) in the message.

The lint also flags spoken sentences over 30 words (PROBLEM) and 26 to 30 words (note). Keep every
line of the file under 100 characters, stage directions included; wrap them like prose.

Length guide: 3 to 8 minutes, aim for 5 to 7; 7.5 was accepted for episode 02. If a draft runs long, cut the asides and the second
example first, never the explanation of the one thing the episode is about.

---

## 10. Episode map and what each one must not do

From `youtube/README.md`. The "must not" column is the depth limit: material that belongs to a
later episode must not leak in, beyond a one-clause teaser.

| # | Episode | Kind | Must not |
|---|---|---|---|
| 01 | Codecs (approved) | CONCEPT | GOPs, I/P/B frames, quantisation, container details |
| 02 | Containers, muxing, demuxing (approved) | CONCEPT | MP4 box structure, fragmented MP4, HLS/CMAF, reading header numbers aloud |
| 03 | Media processing is a graph: elements, pads and pipelines | MEMBRANE | flow control, bins, dynamic pads, `via_in`/`via_out`, callback context, Endpoint as a fourth kind, "pads are checked at link time" (they are checked when the stream format arrives). Opens with the tool-independent idea: a player as a dataflow graph (GStreamer, FFmpeg filter graphs). Example: MP3 file → MP3 decoder → speakers |
| 04 | Raw audio and video in memory: frames, RGB, I420, samples, PCM | CONCEPT | colour science, chroma siting, HDR, stride, other pixel formats, colour inversion or any custom element, timestamps, "the stream format carries the frame rate" (it is nil in the example). Example: Transcoder asked for raw output, two file sinks |
| 06 | Writing an element: pads, callbacks, buffers | MEMBRANE | manual demand, bins |
| 07 | Timestamps: PTS, DTS, pace | CONCEPT | full B-frame reordering algorithm, clocks/sync |
| 08 | Flow control: backpressure, toilet | CONCEPT+MEMBRANE | internals of demand accounting |
| 09 | Reading a real element: StreamSwitcher | MEMBRANE | re-explaining 06 and 08 at length |
| 10 | WebRTC: signaling, ICE, RTP | CONCEPT | SDP grammar, DTLS/SRTP details, TURN deployment |
| 11 | Live streams: push, toilet, buffer or drop | CONCEPT+MEMBRANE | adaptive bitrate, CDN |
| 12 | Composing: Bins, dynamic pads, notifications | MEMBRANE | writing a Bin from scratch |

Episodes 03 and 04 were written on 2026-11-02 and absorbed the old drafts "04 Describing a pipeline"
(folded into 03) and "05 Raw video" (folded into 04, together with the planned raw audio episode).
Episodes 06 to 12 keep their old numbers until they are rewritten; 05 is free. Confirm numbering with
the author before creating a new directory.

Episodes 06 to 12 exist as drafts written before the voice rules and the finished-example rule
were settled. **Treat them as raw material, not as scripts.** When asked to work on one, run the
full loop of §5 on it: a style pass alone is not enough, the examples and facts need the §4
treatment, and the structure needs to match episode 01.

---

## 11. Done means

- [ ] `scenario.md` follows §3; Version A reads aloud as a person talking (§2); one weighted
      sentence per episode, nothing else underlined.
- [ ] Every claim traceable to a slide, a DEEP_DIVE section or `deps/`; every number recomputed;
      every snippet complete, verified identifier by identifier, walked through top to bottom.
- [ ] No "last episode", "repo", "workshop", "you've probably", etymology, staccato runs.
- [ ] Lint passes; words and minutes reported; within 3 to 8 minutes.
- [ ] A fresh reviewer has done the three passes and every finding is applied or answered.
- [ ] Graphics rendered in both variants, looked at, named in script order, listed in
      `images/README.md`, referenced from the stage directions. No code graphics, nothing licensed.
      Build-up steps identical in size; highlights as in §6; the author has seen rendered variants
      for every subjective choice.
- [ ] A fresh reviewer has read the final text **after the last edit**, with the PNGs open.
- [ ] If the episode shows a pipeline: `example/` exists, its spec matches the slide byte for byte,
      it was run from its directory with a clean terminal, the output was probed and deleted.
- [ ] Hand-over message per §8. Nothing committed unless asked.
