# 03 · Media processing is a graph: elements, pads and plugins

| | |
|---|---|
| Type | MEMBRANE |
| Length | 5-6 min |
| SEO title | "How media pipelines work: sources, filters, sinks (and how Membrane does it in Elixir) (Multimedia 101 #3)" |
| Keywords | media pipeline, dataflow graph, gstreamer pipeline explained, membrane framework elixir, elixir multimedia, source filter sink |
| Source | Ch. 1 slides "Membrane in one slide", "Three kinds of elements" |
| On screen | A player drawn stage by stage as a graph. The slide with three PIDs. The Source → Filter → Sink diagram. A short list of plugin package names. |

## Facts that must land

- Media processing is naturally a graph: read → demux → decode → process → encode → mux → display. Each stage has one job and knows only its input and output.
- This is not a Membrane idea. GStreamer, FFmpeg filtergraphs, DirectShow all use the same model.
- In Membrane the graph is a pipeline and the stages are elements. Every element is an Erlang process.
- Consequences of "element = process": concurrency for free, crash isolation, and a mailbox that can grow (episode 8).
- Three kinds of elements: Source (only output pads), Filter (input and output), Sink (only input pads).
- Elements connect through pads. Pads declare what they accept, and only compatible pads can be linked. A pipeline cannot have dangling pads.
- `membrane_core` is the engine. Elements ship in plugins, one per domain: files, MP4, H.264, WebRTC.

---

## Version A (detailed)

**[0:00] Cold open. A diagram of six boxes and arrows, no labels.**

> Here's a program that reads two files, decodes them, re-encodes them, and writes a movie.
> It has no loops. No threads you manage. No buffers you allocate. It's a drawing.
> Boxes and arrows. And that drawing is the program.

**[0:15] Bumper**

**[0:20] On camera**

> This episode is about how multimedia software is structured, and then about how Membrane,
> the Elixir framework I work on, turns that structure into running code. If you've used
> GStreamer or FFmpeg's filtergraphs, the first half will feel familiar. The second half is
> where Elixir makes it interesting.

**[0:40] The concept: a graph. Build the diagram stage by stage.**

> Think about what a video player does. It reads bytes from a file. It splits them into tracks,
> that's the demuxer from episode two. It decodes the video. It decodes the audio. Maybe it scales
> the picture. Then it sends pixels to the screen and samples to the sound card.

> Every stage has one job. Every stage knows only what comes in and what goes out. The decoder
> doesn't care whether the bytes came from a file or from the network. The screen doesn't care
> which codec was used. Media flows through, stage to stage, and nothing ever holds the whole file.

> That's a dataflow graph, and it's how pretty much every multimedia system is built.
> GStreamer calls the stages elements. FFmpeg calls them filters. DirectShow called them filters
> too. Same idea for thirty years, because it fits the problem: streams are long, stages are
> independent, and you want to swap one without touching the others.

**[1:40] In Membrane. Slide "Membrane in one slide", three PIDs.**

> In Membrane the graph is called a pipeline and the stages are elements. Here's the part that's
> different from the C frameworks: every element is an Erlang process. Its own mailbox, its own
> state, its own crash. Media moves between them as messages.

> You get a few things for free from that. Elements run concurrently on all your cores without
> you writing a single lock. If one element crashes, the supervisor sees it and the rest of your
> system doesn't. And, this one comes back in episode eight, a slow process with a fast neighbour
> has a mailbox that grows, which is a problem the framework has to solve for you.

**[2:20] Three kinds of elements. Slide "Three kinds of elements".**

> There are three kinds of elements. A source has only outputs: it starts the stream. It reads a
> file, captures a camera, receives from the network. A sink has only inputs: it ends the stream.
> It writes a file, draws on screen, sends to a peer. A filter has both. Decoders, encoders,
> muxers, parsers, your own processing: filters, all of them, and they're the most common kind.

**[2:50] Pads.**

> Elements connect through pads. A pad is a named port, input or output, and it declares what
> kind of stream it accepts: raw video in RGB, an H.264 stream, anything. You can only link an
> output to an input that agrees on the format. If they don't agree, Membrane refuses to link
> them and tells you which pad. That check is the difference between a crash at startup with a
> clear message and a corrupted file you discover a week later.

> One more rule: a pipeline can't have dangling pads. Every output has to go somewhere. A source
> alone isn't a pipeline, and neither is a source and a filter. The chain has to end in a sink.

**[3:30] Core and plugins.**

> Where do the elements come from? The engine is one package, `membrane_core`. It knows about
> pipelines, elements, pads, and how media moves between processes. It knows nothing about MP4
> or H.264. Those live in plugins, one package per domain: a file plugin with a file source and a
> file sink, an MP4 plugin with a muxer and a demuxer, an H.264 plugin, a WebRTC plugin, and so on.
> You pull in the ones you need, and you can write your own, which is episode six.

```elixir
{:membrane_core, "~> 1.3"},
{:membrane_file_plugin, "~> 0.17"},
{:membrane_mp4_plugin, "~> 0.36"},
{:membrane_transcoder_plugin, "~> 0.5"}
```

> Four dependencies. The engine, files, MP4, and codecs. That's enough to read a file, transcode
> it, and write an MP4.

**[4:10] Back to the drawing, now with labels.**

> Back to the drawing from the start. Two file sources. A deserializer that takes a container
> apart. Two transcoders. A muxer with two inputs. A file sink. Seven elements, seven processes,
> each doing one thing, media flowing left to right. How you write that drawing down as code is
> the next episode.

**[4:40] Takeaway + next**

> Media processing is a graph of independent stages. In Membrane each stage is a process, pads
> are the typed connections between them, and the engine is separate from the elements. Next:
> describing that graph in Elixir, with one complete example.

**[5:00] End**

---

## Version B (room for you)

**Hook, pick one:**

1. "This program is a drawing." Diagram without labels.
2. A GStreamer one-liner on screen (`gst-launch-1.0 filesrc ! decodebin ! autovideosink`): "If
   you've seen this, you already know half of this episode." `[YOU: your relationship with
   GStreamer?]`
3. `[YOU: why Elixir for multimedia? People ask this all the time. Answer in 20 seconds, then let
   the rest of the episode make the case.]`

**Beats:**

1. What a player does: read → demux → decode → scale → display. Each stage one job, knows only
   input and output.
2. This is a dataflow graph. GStreamer, FFmpeg, DirectShow: the same model for 30 years.
3. Membrane: pipeline + elements. **Element = Erlang process.** What follows: free concurrency,
   crash isolation, mailboxes (tease episode 8). `[YOU: your favourite consequence of
   "element = process"? Observer? Supervisors? Hot code reload?]`
4. Source / Filter / Sink. Pads, format compatibility checked at link time, no dangling pads.
5. Core vs plugins. Four deps on screen.
6. Diagram with labels: "now you can read it".
7. Next: the spec, in code.

**What not to do:** don't explain buffers, stream formats, callbacks or flow control yet. This
episode is about the shape of the program, not its behaviour. Don't compare Membrane with
GStreamer in a judging way; "same idea" is enough.
