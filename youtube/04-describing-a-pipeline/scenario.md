# 04 · Describing a pipeline in code: callbacks, actions and the spec

| | |
|---|---|
| Type | MEMBRANE |
| Length | 6-7 min |
| SEO title | "Membrane pipelines explained: callbacks, actions and the spec DSL, with a full transcoding example (Multimedia 101 #4)" |
| Keywords | membrane pipeline, elixir transcoding, membrane spec, child via_in via_out, elixir mp4 muxing, membrane tutorial |
| Source | Ch. 1 slides "Pipelines: callbacks and actions" … "Knowing when to stop", DEEP_DIVE Ch. 1 "Pipelines" |
| On screen | Snippets next to the mermaid diagrams from the slides (`child`, `get_child`, `via_in`/`via_out`). Then the full example pipeline, revealed branch by branch, with the transcoding pipeline diagram from the slides as its picture. Optional clip: `ffprobe` on the resulting MP4 showing h264 + aac. |

## Facts that must land

- A pipeline is a module. Membrane calls its callbacks, the callbacks return actions. `handle_init/2` returns `{[spec: spec], state}`.
- The spec DSL: `child/2` starts a chain, `child/3` extends it, piping links default pads. A struct instead of a module passes element options.
- The spec is a list, each entry is a branch. `get_child` refers to an already defined child, which is how one element gets two inputs.
- `via_in`/`via_out` pick a named pad and pass pad options. The Transcoder's output format is a pad option, so it goes in `via_out`.
- When the callback returns, the children are spawned and linked exactly as described and media starts flowing.
- The pipeline doesn't know when it's done. `handle_element_end_of_stream/4` fires for every child; match on the last one and return `terminate: :normal`.
- The example: MP3 and VP8-in-IVF in, MP4 with AAC and H.264 out. Two container-related details: `content_format: Membrane.MPEGAudio` on the MP3 source, and `stream_structure: :avc1` / `config: :esds` on the transcoders because the muxer needs them.

---

## Version A (detailed)

**[0:00] Cold open. The full example pipeline on screen, about forty lines, too small to read. Then `ffplay` of the resulting MP4 for two seconds.**

> Forty lines. An MP3 and a VP8 video go in, an MP4 with AAC and H.264 comes out, and there's not
> a single loop in there. Let's read it.

**[0:15] Bumper**

**[0:20] On camera**

> Last episode: a pipeline is a graph of elements, each one a process. This episode is about how
> you write that graph down. There's a small set of functions for it, and by the end you'll be
> able to read any Membrane pipeline you come across, including the one from the cold open.

**[0:40] The pipeline is a module. Slide "Pipelines: callbacks and actions".**

> A pipeline is a module. You `use Membrane.Pipeline`, and from then on Membrane calls your
> callbacks and your callbacks return actions. That's the whole programming model, and it's the
> same for elements later on.

```elixir
defmodule TranscodingPipeline do
  use Membrane.Pipeline

  @impl true
  def handle_init(_ctx, _opts) do
    spec = ...
    {[spec: spec], %{}}
  end
end
```

> `handle_init` runs when the pipeline starts. It returns a list of actions and a state. The one
> action we care about today is `spec`: a description of the graph. When this callback returns,
> Membrane spawns the children and links them exactly as described, and media starts flowing.

**[1:15] The DSL. Slides `child`, `get_child`, `via_in`/`via_out`, next to the diagrams.**

> The spec is built with a handful of functions. `child` with a name and a module starts a chain.
> Piping into another `child` links them: default output pad to default input pad.

```elixir
child(:my_source, MySource)
|> child(:my_filter, MyFilter)
|> child(:my_sink, MySink)
```

> Source, filter, sink. Three processes, two links. If an element needs options, you pass a
> struct instead of the module name:

```elixir
child(:my_source, %MySource{some_option: :value})
```

> The spec is a list, and every entry is a branch. To link a second source into a filter that's
> already defined, you refer to it by name with `get_child`:

```elixir
spec = [
  child(:my_source, MySource)
  |> child(:my_filter, MyFilter)
  |> child(:my_sink, MySink),

  child(:my_other_source, MySource)
  |> get_child(:my_filter)
]
```

> That's how a muxer gets two inputs. And when the default pads aren't what you want, or a pad
> takes options, you say so explicitly with `via_out` and `via_in`:

```elixir
child(:my_source, MySource)
|> via_out(:some_output, options: [some_pad_option: :some_value])
|> child(:my_filter, MyFilter)
```

> Link the pad called `some_output`, not the default one, and set one of its options. Pad options
> configure a single link; element options configure the whole element. You'll see both in a
> moment.

**[2:30] The example, video branch. Reveal line by line, the diagram highlights the matching box.**

> Now the real thing. An example pipeline that reads an MP3 file and a VP8 video in an IVF
> container, transcodes them to AAC and H.264, and muxes both into one MP4. Video branch first.

```elixir
child(:ivf_file_source, %Membrane.File.Source{location: "video.ivf"})
|> child(:ivf_deserializer, Membrane.IVF.Deserializer)
|> child(:video_transcoder, Membrane.Transcoder)
|> via_out(:output,
  options: [
    output_stream_format: %Membrane.Transcoder.OutputFormat.H264{stream_structure: :avc1}
  ]
)
|> child(:mp4_muxer, Membrane.MP4.Muxer.ISOM)
|> child(:mp4_file_sink, %Membrane.File.Sink{location: "result.mp4"})
```

> A file source, with the location as an element option, so it's a struct. The IVF deserializer
> takes the container apart and gives us the VP8 stream; no options. Then the Transcoder. The
> format it should produce is an option of its output pad, so it goes in a `via_out`: H.264, with
> `stream_structure: :avc1`. That's the container reaching into the codec, from episode two. The
> MP4 muxer wants the H.264 parameter sets stored out of band, in the file header, and this is
> how you ask for that shape. Then the muxer, then a file sink.

**[3:30] The example, audio branch.**

```elixir
child(:mp3_file_source, %Membrane.File.Source{
  location: "audio.mp3",
  content_format: Membrane.MPEGAudio
})
|> child(:audio_transcoder, Membrane.Transcoder)
|> via_out(:output,
  options: [output_stream_format: %Membrane.Transcoder.OutputFormat.AAC{config: :esds}]
)
|> get_child(:mp4_muxer)
```

> Comma, second branch. Another file source, and here's a detail you'll hit in real life: MP3
> has no container, so nothing in the bytes announces what they are. The source has a
> `content_format` option for exactly that; without it, the transcoder downstream gets a stream
> it can't identify and raises. Then a transcoder to AAC, with its config in the MP4 header,
> `esds`, again because the muxer says so. And instead of a new child at the end,
> `get_child(:mp4_muxer)`: link into the muxer we already have. Two inputs, one muxer.

**[4:15] Materialization.**

```elixir
{[spec: spec], %State{}}
```

> Return the spec as an action. Seven processes start. The file sources read, the deserializer
> unpacks, the transcoders decode and encode, the muxer waits for both inputs and interleaves
> them, the sink writes. Nobody in this module wrote a loop.

**[4:35] Knowing when to stop. Slide "Knowing when to stop".**

> One last piece. The pipeline doesn't know when its job is done. The files end, each source
> sends an end-of-stream marker down its branch, and each element passes it on. You decide what
> that means. Usually: when the last element, the sink, receives end of stream, we're finished.

```elixir
@impl true
def handle_element_end_of_stream(:mp4_file_sink, _pad, _ctx, state) do
  {[terminate: :normal], state}
end

@impl true
def handle_element_end_of_stream(_element, _pad, _ctx, state) do
  {[], state}
end
```

> The callback fires for every child that gets end of stream. Match on the one you care about,
> return `terminate`, ignore the rest with a catch-all clause.

**[5:10] Optional clip: `ffprobe result.mp4`, two Stream lines highlighted.**

> And the result is an ordinary MP4: stream zero, h264, stream one, aac. Transcoded, muxed,
> playable anywhere.

**[5:25] Takeaway + next**

> A pipeline is a module whose callbacks return actions. The spec is the graph: `child` to add,
> piping to link, `get_child` to branch, `via_in` and `via_out` to pick pads and set their
> options. End of stream is yours to interpret. Next episode we open up the middle of a pipeline
> like this one and look at what a raw video frame actually is. Bytes. Lots of them.

**[5:50] End**

---

## Version B (room for you)

**Hook, pick one:**

1. The whole pipeline on screen, unreadably small, then the resulting video for two seconds.
   "Forty lines. Let's read it."
2. `[YOU: how many lines is your smallest useful multimedia program? Start with that number.]`
3. A question: "How do you write down a graph in a language that only has functions and data?"
   Answer: a list of pipes.

**Beats:**

1. Module, callbacks, actions. `handle_init` → `spec`.
2. DSL on toy examples: `child`, struct = options, list = branches, `get_child`, `via_in`/`via_out`.
   Pad options vs element options, one sentence.
3. The example, video branch: source → deserializer → transcoder (`via_out`, `avc1`) → muxer →
   sink. At `avc1`: "container reaching into codec, episode two".
4. The example, audio branch: source with `content_format` → transcoder (`esds`) →
   `get_child(:mp4_muxer)`. `[YOU: the first time you forgot `content_format`, or something
   like it. What did the error look like?]`
5. Return the spec: seven processes, no loops.
6. End of stream → `terminate`. Two clauses. "The pipeline doesn't know when it's done. You do."
7. Optional `ffprobe`. `[YOU: a sentence on why you like that the result is a plain MP4 and not
   a Membrane-specific anything.]`
8. Next: raw frames.

**What not to do:** don't explain what a `Membrane.Buffer` or a stream format is, that's episodes
five and six. Don't show every pipeline callback, there's one that matters today. Don't dwell on
`mix.exs` or on how to run the module; the point is reading the spec, not setting up a project.
