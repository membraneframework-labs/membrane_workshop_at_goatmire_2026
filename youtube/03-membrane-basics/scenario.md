# 03 · Media processing is a graph: elements, pads and pipelines

| | |
|---|---|
| Type | MEMBRANE |
| Length | 7 min |
| SEO title | "How a Membrane pipeline works: elements, pads and plugins explained (Multimedia 101 #3)" |
| Keywords | membrane framework elixir, elixir multimedia, what is a media pipeline, media processing graph, membrane pipeline tutorial |
| Source | Ch. 1 slides "Membrane in one slide", "Three kinds of elements", "Pipelines: callbacks and actions", "Describing a pipeline: `child`", "Bringing it to life", "Knowing when to stop"; DEEP_DIVE Ch. 1 "Building blocks", "Pipelines", "Building the pipeline"; `notes/facts.md` for every verified detail |
| On screen | Overlays from `images/` (see `images/README.md` for the file ↔ timestamp map): the player drawn as boxes, built up in six steps; the same drawing with every box a process; the three kinds of elements; two elements joined through pads; the core and the plugins; the example pipeline with each element highlighted in turn; the takeaway. Code comes from the Keynote presentation. |

---

## Version A (detailed)

**[0:00] Cold open. On camera. Overlays `01-player-1.png` to `01-player-6.png`: the player drawn as boxes with arrows, data flowing top to bottom, one build-up step per spoken step: "reads the bytes" (Read the file), "splits them" (Split into tracks), "decodes each of them" (Decode video on the left, then Decode audio on the right, two steps in quick succession), "pictures on the screen" (Screen), "sound to the speakers" (Speakers). The drawing stays up through "boxes and arrows".**

> Think about what a video player has to do when you want to play a movie. It reads the bytes from
> the disk or network and splits them into a video track and an audio track. Then it decodes each
> track, which means unpacking the compressed media back into pictures and sound. After that it puts
> these pictures on the screen and sends the sound to the speakers. And none of those steps needs to
> know how the others work inside. The decoder doesn't care whether the bytes came from a file or
> from the network, and the screen doesn't care how the video was compressed. Each step cares only
> about what comes in and what goes out, and that's why you can draw this kind of software as boxes
> and arrows. Membrane is built around that idea, and the code you write looks very much like this.

**[1:00] Bumper**

**[1:05] On camera**

> In this video I'll explain how software that processes media streams is usually structured: as a
> graph of small steps that the media flows through. Then I'll show how that graph looks in
> Membrane. We'll see what an element is, what a pad is, where elements come from, and how a
> complete pipeline is written.

**[1:25] Overlay `01-player-6.png` comes back for this section.**

> Let's go back to the player. None of those boxes holds the whole movie. The data goes through in
> small chunks, one after another, so different boxes can be busy with different chunks at the same
> time.

**[1:40] On camera.**

> Membrane is an open-source framework for building this kind of software in Elixir. It's a library
> you add to your project. You describe the drawing, which steps there are and how they connect, and
> Membrane runs it. It starts every step, moves the data between them and tells you when something
> happens, like the end of a stream. You write only the parts that are specific to your application,
> and often not even those, because most steps already exist.

**[2:15] Overlay `02-processes.png`: the same drawing, every box now labelled as a process.**

> In Membrane, that drawing is called a pipeline and the boxes are called elements. And every
> element is a separate process. It's an Elixir process, not an operating system one, so it's cheap.
> Each one has its own state and its own mailbox, and the media moves between them as messages. So
> all the elements run concurrently, without you writing any threading code.

**[2:40] Overlay `03-three-kinds.png`: Source, Filter and Sink stacked top to bottom, in that order, each tile with its inputs and outputs drawn as arrows (an arrow in from above, an arrow out below), no captions. Speak them in screen order.**

> There are three kinds of elements you'll meet in almost every pipeline. A source has only outputs,
> and it's where a stream starts: it reads a file or receives data from the network. A filter has
> both inputs and outputs, so it takes a stream in and gives a stream out. That's the most common
> kind: decoders are filters, and so are encoders, which compress rather than unpack, and so is most
> of what you write yourself. And a sink has only inputs, and it's where a stream ends: it writes a
> file or plays the sound.

**[3:15] Overlay `04-pads.png`: two elements joined by one link, the output pad and the input pad named, "uncompressed audio" written on the link.**

> Elements connect through pads, and those inputs and outputs we just saw are the pads. A pad is a
> named input or output of an element, and it declares what kind of stream it accepts: uncompressed
> audio, compressed video, or anything at all. You link an output pad of one element to an input pad
> of another, here the output of an MP3 decoder to the input of an audio sink. The two have to agree
> on the format. If they don't, the pipeline fails the moment the stream is about to flow through
> that link, with an error naming the pad.

**[3:55] Overlay `05-plugins.png`: a "membrane_core" box and the plugin cards next to it: file, MP4, H.264, WebRTC, and an ellipsis.**

> Where do the elements come from? The framework itself is one package, called membrane core. It
> knows how to run pipelines, elements and pads, and nothing about any particular media format.
> Almost all elements live in separate packages called plugins, usually one per domain. There's a
> file plugin with a file source and a file sink, and an MP4 plugin with a muxer and a demuxer.
> There's an H.264 plugin, a WebRTC plugin, and so on. You add the ones you need to your project,
> and you can write your own.

**[4:35] Overlay `06-pipeline-1.png`: the example pipeline, three tiles top to bottom: File source, MP3 decoder, Audio sink. Then `06-pipeline-2.png`, `-3.png`, `-4.png`: each tile highlighted in turn, one per sentence.**

> Let's look at a complete pipeline. This one plays an MP3 file through your speakers. An MP3 file
> holds just one audio track, so there is nothing to split, and three elements are enough. The file
> source reads the file and sends the bytes on. The MP3 decoder turns the compressed audio into raw
> samples, the plain numbers a sound card can play. And the audio sink hands those samples to the
> sound card, so we have a source, a filter and a sink.

**[5:05] Keynote presentation: the module, built up as you speak. The first paragraph is spoken over the empty slide. Then the lines appear in order: the `defmodule` and `use` lines, the `handle_init` head, the three `child` lines one by one, the return tuple, the two end-of-stream clauses, and finally the `start_link` line. Each sentence corresponds to the lines appearing at that moment. The slide ends on the bare `start_link` call; the runnable script in `example/` additionally pattern-matches the three-element result tuple (ok, supervisor pid, pipeline pid) and waits for the pipeline to finish.**

```elixir
defmodule Mp3Player do
  use Membrane.Pipeline

  @impl true
  def handle_init(_ctx, _opts) do
    spec =
      child(:source, %Membrane.File.Source{location: "input.mp3"})
      |> child(:decoder, Membrane.MP3.MAD.Decoder)
      |> child(:sink, Membrane.PortAudio.Sink)

    {[spec: spec], %{}}
  end

  @impl true
  def handle_element_end_of_stream(:sink, _pad, _ctx, state) do
    {[terminate: :normal], state}
  end

  @impl true
  def handle_element_end_of_stream(_child, _pad, _ctx, state) do
    {[], state}
  end
end

Membrane.Pipeline.start_link(Mp3Player)
```

> Now let's look at how it's written. A pipeline is an Elixir module that implements a few
> callbacks. The framework talks to your module by calling those callbacks, and your module answers
> by returning actions. You can think of actions as instructions for the framework: they say what is
> supposed to happen next.

> Our module starts with "use Membrane.Pipeline", which makes it a pipeline. The first callback is
> handle init, and Membrane calls it once, when the pipeline starts. Inside it we describe the
> graph. "child" adds one element to the description, one line per box in the drawing. The pipe
> operator is the arrow between the boxes: it links the output of one element to the input of the
> next. This way, the second line adds the decoder, linked to the source, and the third one adds the
> audio sink, linked to the decoder.

> Each callback returns two things. The first is a list of actions. In the case of handle init, that
> list holds one action, spec, with the graph we just described. When Membrane gets it, it starts
> the three processes, links their pads, and the audio starts to flow.

> The second thing is the state of the pipeline. We don't need any here, so it's just an empty map.

> One more thing is needed, because the pipeline doesn't know on its own when the job is done. When
> the source reaches the end of the file, it sends an end-of-stream signal down the chain. Membrane
> calls this callback every time one of the elements receives it. We only care about the sink,
> because when the end of stream gets there, every sample has already been handed to it and nothing
> more is coming. So for the sink we return the terminate action, which shuts the pipeline down
> cleanly, and for any other element we return no actions at all.

> And the last line starts it: you call start link with the module.

**[7:20] Overlay `07-takeaway.png`.**

> So, media processing is a graph of small steps, and in Membrane that graph is a pipeline of
> elements, and every element is a separate process. They are linked through pads, and they come
> from plugins. You describe the graph in a callback and Membrane starts it. That's enough to read a
> pipeline like the one we just saw. Thanks for watching, and see you in the next episode.

**[7:45] End**

---

## Version B (room for you)

**Hook, pick one:**

1. The player as six boxes appearing one by one. End on "the code you write looks very much like this".
2. `[YOU: the first time you drew a pipeline on a whiteboard and realised the drawing was the program]`
3. `[YOU: a media tool one-liner you remember, and what each piece of it was]`

**Beats:**

1. What a player does, step by step. Each step has one job and knows only its input and output, so the software can be drawn as boxes and arrows; in Membrane the drawing is what you write. The data goes through in chunks, so different steps are busy with different chunks at the same time.
2. No other frameworks named, and no "dataflow graph" term; the drawing speaks for itself.
3. What Membrane is: a library you add to your project; you describe the drawing, Membrane runs it (starts the steps, moves the data, tells you when something happens). Then: pipeline, elements, **every element is a separate process** (an Elixir process, cheap). Concurrency for free. `[YOU: what that felt like coming from a C framework, if you have the story]`
4. Three kinds, in screen order: source (only outputs), filter (both; the most common kind), sink (only inputs).
5. Pads: named inputs and outputs with an accepted format; formats must agree or the pipeline fails when the stream is about to flow, naming the pad. (The dangling-pads rule and optional pads were cut by the author.)
6. Core and plugins: `membrane_core` knows nothing about media formats; file, MP4, H.264, WebRTC plugins; write your own.
7. The example: MP3 file → MP3 decoder → speakers, a source, a filter and a sink. Then the module from Keynote, top to bottom: `use Membrane.Pipeline`, `handle_init` describing the graph with `child` and the pipe (pads default to `input`/`output`), the `spec` action and the empty state, end of stream on the sink → `terminate`, catch-all clause, `start_link`.
8. Takeaway, then a plain goodbye. No promise about the next topic.

**What not to do:** no flow control, demands or mailboxes filling up (that's a later episode); no
bins, no dynamic pads, no `via_in`/`via_out`, no Endpoint as a fourth kind (say "three kinds you'll
meet in almost every pipeline", not "exactly three"); no callback context; no claim that pads are
checked at link time (they are checked when the stream format arrives); don't say `child` starts a
process (the `spec` action does); don't call the Transcoder an element if it comes up (it doesn't
here).
