# 03 · Media processing is a graph: elements, pads and pipelines

| | |
|---|---|
| Type | MEMBRANE |
| Length | 7-8 min |
| SEO title | "How a Membrane pipeline works: elements, pads and plugins explained (Multimedia 101 #3)" |
| Keywords | membrane framework elixir, elixir multimedia, what is a media pipeline, media processing graph, membrane pipeline tutorial |
| Source | Ch. 1 slides "Membrane in one slide", "Three kinds of elements", "Pipelines: callbacks and actions", "Describing a pipeline: `child`", "Bringing it to life", "Knowing when to stop"; DEEP_DIVE Ch. 1 "Building blocks", "Pipelines", "Building the pipeline"; `notes/facts.md` for every verified detail |
| On screen | Overlays from `images/` (see `images/README.md` for the file ↔ timestamp map): the player drawn as boxes, built up in six steps; the same graph framed as "Membrane runs it", then framed as a pipeline with one box tagged as an element; the three kinds of elements; two elements joined through pads; the core and the plugins; the example pipeline with each element highlighted in turn; the takeaway. Code comes from the Keynote presentation. |

---

## Version A (detailed)

**[0:00] Cold open. On camera. Overlays `01-player-1.png` to `01-player-6.png`: the player drawn
as boxes with arrows, data flowing top to bottom, one build-up step per spoken step: "reads the
file" (Read the file), "splits it" (Split into tracks), "decodes each track" (Decode video on the
left, then Decode audio on the right, two steps in quick succession), "pictures on the screen"
(Screen), "sound to the speakers" (Speakers). The graph stays up through "boxes and arrows".**

> Think about what a video player has to do when you want to play a movie. It reads the file, or a
> stream from the network, and splits it into a video track and an audio track. Then it decodes each
> track, which means unpacking the compressed media back into pictures and sound. After that it puts
> these pictures on the screen and sends the sound to the speakers. And none of those steps needs to
> know how the others work inside. The decoder doesn't care whether the bytes came from a file or
> from the network, and the screen doesn't care how the video was compressed. Each step cares only
> about what comes in and what goes out, and that's why you can draw this kind of software as boxes
> and arrows. Membrane, the framework this series is about, is built around that idea, and the code
> you write looks very much like this.

**[1:00] Bumper**

**[1:05] On camera**

> in this video, we will explore how processing of media streams is usually structured. 
> We will see how Membrane Framework handles it with its Pipelines and Elements.
> Then, at the end, we will go through a simple, concrete exmple.


**[1:30] On camera. Overlay `02-membrane-runs-it.png` on "You describe the graph": the player
graph from the cold open inside a frame labelled "Membrane runs it".**

> But first, in case you don't know Membrane yet, a few words about what it is. Membrane is an
> open-source framework for building this kind of software in Elixir. It's a library you add to your
> project. You describe the graph processing steps, and Membrane runs it. Membrane starts every step, 
> moves the data between the steps and tells you when something
> happens, like that the stream has ended. Its advantage is that you can build a pipeline customised
> exactly to your needs, or even define your custom processing steps. That matters especially in 
> non-standard cases, where fiddling with the flags of a
> ready-made tool like FFmpeg isn't enough anymore.

**[2:15] Overlay `01-player-6.png` comes back for this section.**

> Now, let's go back to the player. None of those boxes ever holds the whole movie at once. The data goes
> through in small chunks, one after another, so different boxes can be busy with different chunks
> at the same time.

**[2:30] Overlay `03-pipeline-and-elements.png`: the same graph inside a frame labelled
"pipeline", one box tagged "element".**

> In Membrane, that graph is called a pipeline and the boxes are called elements. Every element runs
> independently of the others. And because Membrane and Elixir take care of the concurrency, you
> don't have to implement any threading or parallelisation yourself.

**[2:45] Overlay `04-three-kinds.png`: Source, Filter and Sink stacked top to bottom, in that
order, each tile with its inputs and outputs drawn as arrows (an arrow in from above, an arrow out
below), no captions. Speak them in screen order.**

> There are three kinds of elements you'll meet in almost every pipeline. A source has only outputs,
> and it's where a stream starts. It might read a file or receive data from the network. A filter
> has both inputs and outputs, so it takes a stream in and gives a stream out. Decoders are filters,
> and so are encoders, muxers and demuxers. Most of what you write yourself will be a
> filter too. And finally, a sink. It has only inputs, and it's where a stream is consumed. Sinks might, for
> example, save the stream to a file or pass it to the speakers.

**[3:25] Overlay `05-pads.png`: two elements stacked, MP3 decoder above Audio sink, joined by one
vertical link. The pad squares sit where the arrow stubs were in the previous overlay: `output` on
the bottom edge of the decoder, `input` on the top edge of the sink, "uncompressed audio" written
beside the link.**

> Membrane elements connect to each other through pads. A pad is a named input or output of an
> element. You link an output pad of one element to an input pad of another. Here it's the output of
> an MP3 decoder going into the input of an audio sink. Pads also declare the format of the stream
> they accept, and two linked pads have to agree on that format. If they don't, the pipeline fails
> the moment the stream is about to flow through that link.

**[4:00] Overlay `06-plugins.png`: a "membrane_core" box and the plugin cards next to it: file,
MP4, H.264, WebRTC, and an ellipsis.**

> Where do Membrane elements come from? The framework itself is one package, called membrane core.
> It knows how to run pipelines and elements, but nothing about any particular media format.
> Almost all elements live in separate packages called plugins, usually one per domain. There's a
> file plugin with a file source and a file sink, and an MP4 plugin with a muxer and a demuxer.
> There's an MP3 plugin, a WebRTC plugin, and so on. You can add ready-made plugins to project,
> or you can write your own too.

**[4:35] Overlay `07-pipeline-1.png`: the example pipeline, three tiles top to bottom: File
source, MP3 decoder, Audio sink. Then `07-pipeline-2.png`, `-3.png`, `-4.png`: each tile
highlighted in turn, one per sentence.**

> Let's look at a complete pipeline. This one plays an MP3 file through your speakers. An MP3 file
> holds just one audio track, so there is nothing to split, and three elements are enough. The file
> source reads the file and sends the bytes on. The MP3 decoder turns the compressed audio into raw
> samples, it is the plain numbers a sound card can play. And the audio sink hands those samples to the
> sound card. This way, we get a pipeline with a single source, a filter and a sink.

**[5:10] Keynote presentation: the module, built up as you speak. The first paragraph is spoken
over the empty slide. Then the lines appear in order: the `defmodule` and `use` lines, the
`handle_init` head, the three `child` lines one by one, the return tuple, the two end-of-stream
clauses, and finally the `start_link` line. Each sentence corresponds to the lines appearing at
that moment. The slide ends on the bare `start_link` call; the runnable script in `example/`
additionally pattern-matches the three-element result tuple it returns and waits for the pipeline
to finish.**

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

> Now let's look at how it's written. A Membrane Pipeline is an Elixir module that implements a few
> callbacks. The framework talks to your module by calling those callbacks, and your module answers
> by returning actions. Actions are simply instructions for the framework.

> Our module starts with "use Membrane.Pipeline", which makes it a pipeline. The first callback is
> handle init, and Membrane calls it once, when the pipeline starts. Inside it we describe the
> processing graph. "child" adds one element to the pipeline's graph. The first line adds the file
> source and tells it which file to read. The pipe operator links two elements, so that one of them
> can pass a media stream to the other. This way, the second line adds the decoder, linked to the
> source, and the third one adds the audio sink, linked to the decoder.

> Each Membrane callback returns two things. The first is a list of actions. In case of our handle
> init, that list holds just one action, spec, with the graph we just described. When the framework gets
> it, it starts the three elements, links their pads, and the audio starts to flow.

> The second thing the callback returns is the state of the pipeline. We don't need any in our
> case, so it will just be an empty map.

> One more thing: pipeline needs to get to know when the processing is completed.
> To have that, we need to implement one more callback. When
> the file source reaches the end of the file, it sends an end-of-stream event down the chain.
> Each time element receives this event, the framework calls handle_child_end_of_stream callback
> in the pipeline. In our case, we only care about the
> sink, because when the end of stream gets there, it means that all the elements we started are
> done with their processing. So for the sink we return the terminate action, which shuts the
> pipeline down cleanly. For any other element we return no actions at all.

> improwizacja z runowaniem demo 

**[7:25] Overlay `08-takeaway.png`.**

> So, in this episode we learnt that media processing can be represented as a graph of small steps.
> In Membrane we call that graph a "Pipeline". The steps are called "elements". They are linked 
> through pads, and the framework defines plenty of them in so-called plugins. 

> Thank you for watching, and see you in the next episode.

**[7:45] End**

---

## Version B (room for you)

**Hook, pick one:**

1. The player as six boxes appearing one by one. End on "the code you write looks very much like
   this".
2. `[YOU: the first time you drew a pipeline on a whiteboard and realised the graph was the
   program]`
3. `[YOU: a media tool one-liner you remember, and what each piece of it was]`

**Beats:**

1. What a player does, step by step. Each step has one job and knows only its input and output, so
   the software can be drawn as boxes and arrows; in Membrane the graph is what you write. The
   data goes through in chunks, so different steps are busy with different chunks at the same
   time.
2. No other frameworks named, and no "dataflow graph" term; the graph speaks for itself.
3. What Membrane is: a library you add to your project; **you describe the graph, and Membrane
   runs it** (starts the steps, moves the data, tells you when something happens). Then the
   vocabulary: pipeline, elements, each running on its own, concurrency without threading code. No
   Elixir-specific vocabulary: the audience may not know Elixir.
4. Three kinds, in screen order: source (only outputs), filter (both; the most common kind), sink
   (only inputs).
5. Pads: named inputs and outputs with an accepted format; formats must agree or the pipeline
   fails when the stream is about to flow, naming the pad. (The dangling-pads rule and optional
   pads were cut by the author.)
6. Core and plugins: `membrane_core` knows nothing about media formats; file, MP4, H.264, WebRTC
   plugins; write your own.
7. The example: MP3 file → MP3 decoder → speakers, a source, a filter and a sink. Then the module
   from Keynote, top to bottom: `use Membrane.Pipeline`, `handle_init` describing the graph with
   `child` and the pipe (pads default to `input`/`output`), the `spec` action and the empty state,
   end of stream on the sink → `terminate`, catch-all clause, `start_link`.
8. Takeaway, then a plain goodbye. No promise about the next topic.

**What not to do:** no flow control, demands or buffers piling up (that's a later episode); no
bins, no dynamic pads, no `via_in`/`via_out`, no Endpoint as a fourth kind (say "three kinds you'll
meet in almost every pipeline", not "exactly three"); no callback context; no claim that pads are
checked at link time (they are checked when the stream format arrives); don't say `child` starts an
element (the `spec` action does); don't call the Transcoder an element if it comes up (it doesn't
here).
