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
  episode opens with its tool-independent idea (a pipeline is a dataflow graph, as in GStreamer or
  FFmpeg filter graphs; backpressure is a general problem) before any Membrane vocabulary.
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
related points with "so", "and", "which", "because" instead of chopping them into fragments.

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

**Reviewers: focus on what the author actually reads aloud.** That is the blockquoted text in
Version A, the lines starting with `> `. Those are the only words the viewer will hear, so that is
where the findings should be. Everything else in the file is scaffolding: the bold `**[m:ss] …**`
stage directions (instructions for the editor), the metadata table, the "Facts that must land"
checklist and Version B. Check the scaffolding only for one thing, that it agrees with the spoken
lines (right overlay file, right number of build-up steps, same terms); don't polish its wording.

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
- **Re-time after every text change.** Recompute the `[m:ss]` marks from the cumulative word count
  (150 wpm, 5 s bumper, rounded to 5 s) and sync the times in `images/README.md`; the lint checks
  they agree.
- The author appreciates one-line corrections of their English in replies (they asked for it).
  Keep it to clear slips, one line, at the end, never preachy.

---

## 8. Hand-over message

The author reads only the final message. It must stand on its own.

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
| 03 | Membrane basics: elements, pads, plugins | MEMBRANE | callback details, flow control, bins. Must open with the general idea: media processing as a dataflow graph (GStreamer, FFmpeg filter graphs) |
| 04 | Describing a pipeline: callbacks, actions, spec | MEMBRANE | writing elements, demand |
| 05 | Raw video in memory: frames, RGB, I420 | CONCEPT | colour science, chroma siting, HDR |
| 06 | Writing an element: pads, callbacks, buffers | MEMBRANE | manual demand, bins |
| 07 | Timestamps: PTS, DTS, pace | CONCEPT | full B-frame reordering algorithm, clocks/sync |
| 08 | Flow control: backpressure, toilet | CONCEPT+MEMBRANE | internals of demand accounting |
| 09 | Reading a real element: StreamSwitcher | MEMBRANE | re-explaining 06 and 08 at length |
| 10 | WebRTC: signaling, ICE, RTP | CONCEPT | SDP grammar, DTLS/SRTP details, TURN deployment |
| 11 | Live streams: push, toilet, buffer or drop | CONCEPT+MEMBRANE | adaptive bitrate, CDN |
| 12 | Composing: Bins, dynamic pads, notifications | MEMBRANE | writing a Bin from scratch |

A **raw audio** CONCEPT episode (samples, sample rate, bit depth, channels, PCM; Membrane part:
Transcoder to raw audio into `Membrane.PortAudio.Sink`) is planned as the audio twin of 05, to sit
between the framework episodes; the author also considered moving 05 up between 03 and 04 so that
concept and framework episodes alternate. Confirm numbering with the author before creating it.

Episodes 03 to 12 exist as drafts written before the voice rules and the finished-example rule
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
- [ ] Hand-over message per §8. Nothing committed unless asked.
