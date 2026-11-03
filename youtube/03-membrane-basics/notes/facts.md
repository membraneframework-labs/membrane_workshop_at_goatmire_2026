# Episode 03 · Media processing is a graph: elements, pads and pipelines: fact sheet

Researcher notes for `youtube/03-membrane-basics/scenario.md`. Everything below was checked against
the sources in the order of authority from `.claude/skills/episode-scenario/SKILL.md` §1: slides,
Chapter 1 materials, `origin/chapter-1-checkpoint`, plugin source in `deps/`, and a real run of the
example. Paths are relative to the repo root unless absolute. Versions actually in `deps/`:
`membrane_core 1.3.4`, `membrane_file_plugin 0.17.5`, `membrane_mp3_mad_plugin 0.18.7`,
`membrane_portaudio_plugin 0.19.6`, `membrane_raw_audio_format 0.12.3`, `membrane_mpegaudio_format
0.3.2`, `membrane_transcoder_plugin 0.5.0`, `membrane_ffmpeg_swresample_plugin 0.21.0` (not used).
`Mix.install` in the example resolved `membrane_core 1.3.5` (one patch newer than `deps/`; nothing
cited below changed between them as far as the example is concerned, it ran).

The old drafts `youtube/03-membrane-basics/scenario.md` and `youtube/04-describing-a-pipeline/scenario.md`
were read as raw material only. Two claims in them are wrong and must not survive: "Membrane refuses
to link them [pads with incompatible formats] and tells you which pad" (the check is not at link
time, see B.9) and "there are three kinds of elements" stated as the whole truth (there is a fourth,
Endpoint, see B.5). The old 04 draft's `[YOU: ...]` story "without content_format the transcoder
raises" is about the Transcoder, not about this episode's decoder (see C.4).

---

## A. The concept in plain statements (tool-independent)

1. Media processing software is built as a chain, more generally a graph, of stages that media flows
   through, each stage doing one job. [slide "Membrane in one slide": "A pipeline is a graph of
   elements that media flows through", `presentation/slides.md:300`; table of contents "Pipelines:
   describing a graph of elements in code", `slides.md:113`]
2. The stages of a player, in order: read the file, take the container apart (demux) into its tracks,
   decode the video track, decode the audio track, show the pictures, play the sound. [demuxing:
   "Whatever reads the stream, like a media player, splits it back into distinct, synchronized
   streams", `slides.md:276-278`; "the thing reading from the file can be a media player, which needs
   to play both video and audio track alongside each other", `materials/Chapter 1/DEEP_DIVE.md:58-62`;
   decoding: "Decoding turns a coded stream into raw media", `slides.md:205`]
3. The same shape appears in transcoding: decoder, raw media, encoder, drawn as boxes with arrows.
   [`slides.md:210-240` (the two Mermaid graphs), `DEEP_DIVE.md:34-49`]
4. Each stage knows only its input and its output. The decoder does not care whether the bytes came
   from a file or from the network; the file source does not know what codec is inside. [File.Source
   moduledoc: "reads chunks of data from given file and sends them as buffers",
   `deps/membrane_file_plugin/lib/membrane_file/source.ex:2-4`; `Membrane.Element.Base` moduledoc:
   "Elements are units that produce, process or consume data ... Each element defines a set of pads,
   through which it can be linked with other elements", `deps/membrane_core/lib/membrane/element/base.ex:10-15`]
5. This is not a Membrane idea. GStreamer uses the same vocabulary: "An element has one specific
   function", "Source and sink elements have only source and sink pads, respectively", "Pads have
   specific data handling capabilities: a pad can restrict the type of data that flows through it",
   "Links are only allowed between two pads when the allowed data types (capabilities) of the two pads
   are compatible", "A pipeline is a top-level bin". [GStreamer Application Development Manual,
   "Foundations", https://gstreamer.freedesktop.org/documentation/application-development/introduction/basics.html,
   fetched 2026-11-02]
6. FFmpeg's filter graphs are the same model: "A filtergraph is a directed graph of connected
   filters", each filter class "defines the features and the number of input and output pads of the
   filter", and "A filter with no input pads is called a "source", and a filter with no output pads
   is called a "sink"." [FFmpeg `doc/filters.texi`, sections "Filtering Introduction" and
   "Filtergraph description", fetched 2026-11-02 from
   https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/doc/filters.texi]
7. GStreamer naming trap, for the writer, not for the viewer: GStreamer calls an *output* pad a
   "source pad" and an *input* pad a "sink pad", so in GStreamer "a source element has only source
   pads". Membrane says `:output` and `:input`. Do not mix the two vocabularies in one sentence.
   [GStreamer page above; `deps/membrane_core/lib/membrane/pad.ex:35-38`]
8. The three roles are defined by the direction of the connectors, not by what the stage does
   inside: a stage with only outputs starts the stream, a stage with only inputs ends it, a stage
   with both is in the middle. [slide "Three kinds of elements", `slides.md:366-382`; FFmpeg and
   GStreamer quotes in 5 and 6]
9. A chain has to start with something that produces data and end with something that consumes it;
   a graph with a loose end is not a valid program. [slide "Three kinds of elements": "A pipeline
   cannot have dangling pads. Every output must be linked to an input", `slides.md:391`; slide
   "Describing a pipeline: child": "The chain starts with a Source and must end with a Sink",
   `slides.md:458`; `DEEP_DIVE.md:168-172`]
10. Nothing in such a program holds the whole file; data moves through the stages a chunk at a
    time. [File.Source `chunk_size` default 2048 bytes, `source.ex:21-25`; the MAD decoder decodes
    frame by frame and emits one buffer per decoded frame, `deps/membrane_mp3_mad_plugin/lib/membrane_mp3_mad_plugin/decoder.ex:119-145`]

---

## B. Membrane facts, each verified against `deps/`

1. **What Membrane is.** "A multimedia framework written in Elixir." [`slides.md:299`] The core
   README: "The most basic media processing entities of Membrane are `Element`s ... Elements can be
   organized into a pipeline - a sequence of linked elements that perform a specific task."
   [`deps/membrane_core/README.md:108-110`]
2. **Pipeline = graph, boxes = elements.** [`slides.md:300`; `Membrane.Pipeline` moduledoc:
   "Pipelines facilitate the convenient instantiation, linking, and management of elements and bins.
   Linking pipeline children together enables them to pass and process data",
   `deps/membrane_core/lib/membrane/pipeline.ex:5-7`]
3. **Every element is a separate Erlang process.** Slide: "Every element is an Erlang process"
   [`slides.md:334`, the slide draws three `#PID<0.10x.0>` circles, `slides.md:323-325`]. Source:
   `Membrane.Core.Element` is `use GenServer` [`deps/membrane_core/lib/membrane/core/element.ex:19`];
   its `start_link/1` is documented "Starts process for element of given module, initialized with
   given options and links it to the current process in the supervision tree. Calls
   `GenServer.start_link/3` underneath" [`core/element.ex:61-69`, the call at `:94-95`]. The parent
   picks `Core.Element` for `component_type: :element` and `Core.Bin` for `:bin` and starts it under
   its subprocess supervisor [`deps/membrane_core/lib/membrane/core/parent/child_life_controller/startup_utils.ex:197-216`].
   The pipeline itself is also a process, started under a dedicated supervisor [`pipeline.ex:14-15`].
4. **Three kinds of elements and the `use` line that declares each.** `use Membrane.Source` sets the
   element type to `:source` and brings only `WithOutputPads` [`deps/membrane_core/lib/membrane/source.ex:30-39`;
   moduledoc "Source elements can define only output pads", `source.ex:10`]. `use Membrane.Filter`
   sets `:filter` and brings both `WithOutputPads` and `WithInputPads` [`filter.ex:32-38`; "Filters
   can have both input and output pads", `filter.ex:10`]. `use Membrane.Sink` sets `:sink` and brings
   only `WithInputPads` [`sink.ex:28-34`; "Sink elements can define only input pads", `sink.ex:9`].
   Slide text: Source "Only output pads. The start of a pipeline: reads a file, captures a camera,
   receives from the network"; Filter "Input and output pads. The most common kind: decoders,
   encoders, parsers, muxers, your own processing"; Sink "Only input pads. The end of a pipeline:
   writes a file, plays on screen, sends over the network" [`slides.md:366-382`].
5. **There is a fourth kind, `Membrane.Endpoint`**, "producing and consuming buffers (contain both
   input and output pads)" [`deps/membrane_core/lib/membrane/element/base.ex:19-25`;
   `Membrane.Element.type` is `:source | :filter | :endpoint | :sink`, `element.ex:39-46`]. The
   workshop slide says three. A safe spoken form: "three kinds you will meet in almost every
   pipeline" or "the three kinds this pipeline uses". Do not say "there are exactly three".
6. **Pads are the connectors.** `Membrane.Pad` moduledoc: "Pads are units defined by elements and
   bins, allowing them to be linked with their siblings ... Each pad is described by its name,
   direction, availability, mode and possible stream format. For pads to be linkable, these
   properties have to be compatible ... Each link can only consist of exactly two pads."
   [`deps/membrane_core/lib/membrane/pad.ex:3-10`]. Directions: "`:output` - data can only be sent
   through such pad, `:input` - data can only be received through such pad. One cannot link two pads
   with the same direction" [`pad.ex:35-40`]. Slide: "Elements connect through pads. Pads must be
   compatible for media to flow" [`slides.md:335`]; DEEP_DIVE: "They can be thought of as connectors
   between elements - they need to be compatible, and if they are, media will flow through them"
   [`DEEP_DIVE.md:163-166`].
7. **Pads are declared with `def_input_pad` / `def_output_pad`, and `accepted_format` is
   mandatory.** The macros: `defmacro def_input_pad(name, spec)`
   [`deps/membrane_core/lib/membrane/element/with_input_pads.ex:86`], `defmacro def_output_pad(name, spec)`
   [`with_output_pads.ex:49`]. Parsing the spec raises a `CompileError` "Field :accepted_format must
   be provided" when it is missing [`deps/membrane_core/lib/membrane/core/child/pads_specs.ex:50-61`].
   The `accepted_format` is a module name or a struct pattern, or `any_of(...)` of those; a bare
   module `My.Format` means `%My.Format{}` [`pad.ex:90-103`]. It is compiled into a `case` with one
   clause per pattern and a `_else -> false` fallback, i.e. a pattern match
   [`pads_specs.ex:63-97`].
8. **The example's pads, as declared.** `Membrane.File.Source`: `def_output_pad :output,
   accepted_format: %RemoteStream{type: :bytestream}, flow_control: :manual`
   [`deps/membrane_file_plugin/lib/membrane_file/source.ex:47`]; it sends
   `%RemoteStream{type: :bytestream, content_format: state.content_format}` [`source.ex:103-104`].
   `Membrane.MP3.MAD.Decoder`: `def_input_pad :input, accepted_format: any_of(RemoteStream, MPEGAudio)`
   and `def_output_pad :output, accepted_format: %RawAudio{sample_format: :s24le}`
   [`deps/membrane_mp3_mad_plugin/lib/membrane_mp3_mad_plugin/decoder.ex:14-16`]; it emits
   `%RawAudio{sample_format: :s24le, sample_rate: sample_rate, channels: channels}` taken from the
   decoded frame [`decoder.ex:122-126`]. `Membrane.PortAudio.Sink`: `def_input_pad :input,
   demand_unit: :bytes, flow_control: :manual, accepted_format: %RawAudio{sample_format: format}
   when format in [:f32le, :s32le, :s24le, :s16le, :s8, :u8]`
   [`deps/membrane_portaudio_plugin/lib/membrane_portaudio_plugin/sink.ex:25-29`]. So `:s24le` out of
   the decoder is inside the sink's list: **no converter is needed**, and
   `Membrane.FFmpeg.SWResample.Converter` was not used.
9. **When the accepted format is checked: when the stream format arrives, not at link time.** The
   only place that evaluates `accepted_format` against a real format is
   `Membrane.Core.Element.StreamFormatController.validate_stream_format!/3`
   [`deps/membrane_core/lib/membrane/core/element/stream_format_controller.ex:92-121`]. It is called
   (a) for the receiving element's input pad inside `exec_handle_stream_format`, i.e. when a
   `stream_format` arrives on the pad [`stream_format_controller.ex:68-76`], and (b) for the sending
   element's output pad when it returns the `:stream_format` action
   [`deps/membrane_core/lib/membrane/core/element/action_handler.ex:490`]. A mismatch raises
   `Membrane.StreamFormatError` with the message "Stream format: ... is not matching accepted format
   pattern `...` in def_input_pad for pad :input in <Module>" [`stream_format_controller.ex:111-116`].
   A grep for `accepted_format` under `lib/membrane/core/parent/` finds nothing: linking does not
   compare formats. What linking does check is that every static (`availability: :always`) pad of
   every child is linked: otherwise `Membrane.ParentError` "Child :x has static pad :y, but it is not
   linked in spec" [`deps/membrane_core/lib/membrane/core/parent/child_life_controller.ex:186-199`].
   Spoken consequence: "if the formats don't match, the pipeline fails as soon as the first stream
   format arrives, with an error naming the pad and the element". Not "it refuses to link".
10. **`Membrane.ChildrenSpec`: `child/2`, `child/3`, `get_child/1`.** `child(child_name, child_definition)`
    starts a link with a named child [`deps/membrane_core/lib/membrane/children_spec.ex:378-383`];
    `child(builder, child_name, child_definition)` adds a named child in the middle of a link
    [`children_spec.ex:403-411`]; piping is literal: the builder returned by one `child` is the
    first argument of the next. `get_child(child_name)` starts a link at an existing child,
    `get_child(builder, child_name)` ends a link at one [`children_spec.ex:327-345`]. Module name or
    struct: "`child(:source, Source) |> child(:filter, %Filter{option: 1}) |> child(:sink, Sink)`"
    [`children_spec.ex:17-21`]. Default pad names: "If pads are not specified, name `:input` is
    assumed for inputs and `:output` for outputs" [`children_spec.ex:60-62`]; `do_get_child/2` inserts
    `via_in(builder, :input)` when no pad was named [`children_spec.ex:351-358`]. Slides: "`child/2`
    starts a chain, `child/3` extends it. Name goes first, module or struct second" [`slides.md:431`];
    "Piping one `child` into the next links them: output pad to input pad" [`slides.md:457`]; options
    go in a struct instead of a module name [`slides.md:553-558`, `DEEP_DIVE.md:254-258`].
11. **`Membrane.Pipeline` callbacks used by the example.** `handle_init/2`: "Callback invoked on
    initialization of the pipeline ... should be used for things, like parsing options, initializing
    state, or spawning children" [`deps/membrane_core/lib/membrane/pipeline.ex:113-122`]; it is
    synchronous, the starter waits for it [`pipeline.ex:116-117`]. Every callback returns
    `{[action], state}` [`pipeline.ex:100-111`]. `handle_element_end_of_stream/4`: "Callback invoked
    when a child element finishes processing a stream via the given pad. By default, it does nothing"
    [`pipeline.ex:207-217`]; the default clause injected by `use Membrane.Pipeline` is
    `def handle_element_end_of_stream(_element, _pad, _ctx, state), do: {[], state}`
    [`pipeline.ex:581-582`]. Once you define the callback yourself that default is gone (Elixir
    overridable semantics), which is why the example needs its own catch-all clause. The path from
    the sink to the pipeline: the sink's `EndOfStream` event is handled in
    `Membrane.Core.Element.EventController.exec_handle_event/4` [`core/element/event_controller.ex:102-135`]
    and the parent maps `Events.EndOfStream` to `:handle_element_end_of_stream`
    [`deps/membrane_core/lib/membrane/core/parent/lifecycle_controller.ex:148-163`].
12. **The `:spec` and `:terminate` actions.** `@type spec :: {:spec, ChildrenSpec.t()}`
    [`deps/membrane_core/lib/membrane/pipeline/action.ex:87`, example with `child`/`via_out`/`get_child`
    at `:70-85`]. `@type terminate :: {:terminate, reason :: :normal | :shutdown | {:shutdown, term} | term}`;
    with `:normal` the pipeline "switches to the zombie mode, requests all the children to terminate,
    waits for them to terminate and then terminates itself" [`action.ex:166-179`]. Slides: "the `:spec`
    action spawns children and links them" [`slides.md:421`]; "When `handle_init/2` returns, the
    children are spawned and linked exactly as described in `spec`. Media starts to flow"
    [`slides.md:590`]; "The pipeline doesn't know when its job is done. You do: when the last element
    gets end of stream" [`slides.md:600`]; the two-clause pattern is the workshop's
    [`slides.md:602-612`, `DEEP_DIVE.md:301-322`, `git show origin/chapter-1-checkpoint:lib/workshop_pipeline.ex`
    lines 52-60]. `Membrane.Pipeline` moduledoc on why: "there is no objective way to tell when a
    Pipeline should terminate. Even if all of it's children have terminated, it doesn't mean that it
    should too" [`pipeline.ex:55-59`].
13. **What `Membrane.Pipeline.start_link/2` returns.** `{:ok, supervisor_pid, pipeline_pid}`; "Pipelines
    always spawn under a dedicated supervisor" and "The supervisor never restarts the pipeline"
    [`pipeline.ex:14-17`; `@type on_start :: {:ok, supervisor_pid :: pid, pipeline_pid :: pid} |
    {:error, ...}`, `pipeline.ex:91-93`; `@spec start_link(module, pipeline_options, config) :: on_start`,
    `pipeline.ex:330-332`]. Three-element tuple, not the usual `{:ok, pid}`; the example matches
    `{:ok, _supervisor, pipeline}` and monitors the pipeline pid. (The workshop's `run_pipeline.exs`
    monitors the supervisor instead; both work.)
14. **Plugins and the naming convention.** "Packages that provide Membrane elements are called
    plugins, and they group elements associated with a similar field together" [`DEEP_DIVE.md:68-72`].
    Core README: "Each plugin lives in a `membrane_X_plugin` repository, where X can be a protocol,
    codec, container or functionality ... Plugins wrapping a tool or library are named
    `membrane_X_LIBRARYNAME_plugin` or just `membrane_LIBRARYNAME_plugin`, like
    `membrane_mp3_mad_plugin`" [`deps/membrane_core/README.md:116-118`]; stream formats live in
    `membrane_X_format` packages [`README.md:120-122`]; the core "provides the API for creating
    pipelines (and custom elements too)" [`README.md:124-130`]. Slide: "`membrane_core` is the
    engine. Elements are shipped in plugins, one per domain: files, MP4, H.264, WebRTC..."
    [`slides.md:336`]. Real examples, all present in `deps/`: `membrane_file_plugin` →
    `Membrane.File.Source`, `Membrane.File.Sink`; `membrane_mp3_mad_plugin` (wraps the MAD library) →
    `Membrane.MP3.MAD.Decoder`; `membrane_portaudio_plugin` (wraps PortAudio) → `Membrane.PortAudio.Sink`,
    `Membrane.PortAudio.Source` [`ls deps/membrane_portaudio_plugin/lib/membrane_portaudio_plugin/`];
    `membrane_mp4_plugin` → `Membrane.MP4.Muxer.ISOM`, `Membrane.MP4.Demuxer.ISOM`. Formats:
    `membrane_raw_audio_format` → `Membrane.RawAudio`, `membrane_mpegaudio_format` → `Membrane.MPEGAudio`.
    The core's own quick start is Hackney source → `Membrane.MP3.MAD.Decoder` → `Membrane.PortAudio.Sink`
    [`deps/membrane_core/README.md:33-59`], so this episode's example is the canonical "hello world"
    with a file instead of a URL.
15. **`Membrane.Transcoder` is a Bin, not an element.** `use Membrane.Bin`
    [`deps/membrane_transcoder_plugin/lib/transcoder.ex:27`]. The series calls it "a component";
    the word "Bin" is reserved for episode 12 (SKILL §4.7). It does not appear in this episode's
    example; if the writer mentions it, "component" only.
16. **Native libraries.** The MAD and PortAudio plugins download precompiled builds on first compile
    ("The precompiled build will be pulled and linked automatically",
    `deps/membrane_mp3_mad_plugin/README.md:20`, `deps/membrane_portaudio_plugin/README.md:17`; Linux
    needs ALSA, `README.md:19-25`). The first run's log shows both downloads (C.2).

---

## C. The example: `youtube/03-membrane-basics/example/mp3_player.exs`

### C.1 The script (final contents)

```elixir
Mix.install([
  {:membrane_core, "~> 1.3"},
  {:membrane_file_plugin, "~> 0.17.4"},
  {:membrane_mp3_mad_plugin, "~> 0.18.7"},
  {:membrane_portaudio_plugin, "~> 0.19.6"}
])

Logger.configure(level: :error)

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

{:ok, _supervisor, pipeline} = Membrane.Pipeline.start_link(Mp3Player)
ref = Process.monitor(pipeline)

receive do
  {:DOWN, ^ref, :process, _pid, _reason} -> :ok
end
```

Files in `example/`: `mp3_player.exs`, `input.mp3` (copy of `assets/bbb.mp3`, 529,492 bytes). No
`.gitignore`: the script writes nothing. `git check-ignore` reports neither file as ignored, so both
are meant to be committed, like `youtube/01-codecs/example/input.mp3`.

Which child is which kind, by its `use` line: `:source` is `Membrane.File.Source`, `use Membrane.Source`
[`deps/membrane_file_plugin/lib/membrane_file/source.ex:10`]; `:decoder` is `Membrane.MP3.MAD.Decoder`,
`use Membrane.Filter` [`decoder.ex:5`]; `:sink` is `Membrane.PortAudio.Sink`, `use Membrane.Sink`
[`sink.ex:6`]. Source → Filter → Sink, in that order, which is exactly the slide
[`slides.md:357-361`].

Version requirements: `membrane_core` and `membrane_file_plugin` as in the root `mix.exs:23-24`;
`membrane_portaudio_plugin "~> 0.19.6"` as in `mix.exs:31`; `membrane_mp3_mad_plugin` is not a
direct dependency of the root project (it arrives through the Transcoder, `deps/membrane_transcoder_plugin/mix.exs:63`
asks for `~> 0.18.4`), so it is pinned to the version in `mix.lock` and `deps/`, `0.18.7`, with the
same three-component style.

### C.2 What was run, exactly

All runs on 2026-11-02, macOS (Darwin 25.6.0, Apple Silicon), Elixir 1.19.5 on OTP 28, default
audio output device, from inside the example directory:

| Run | Command | Exit | Elapsed | Terminal |
|---|---|---|---|---|
| 1 (cold cache) | `cd youtube/03-membrane-basics/example && elixir mp3_player.exs` | 0 | 47 s | Hex resolution, compilation of 31 packages, two Bundlex lines "Successfully downloaded precompiled mad build ... mad_macos_arm.tar.gz" and "... precompiled portaudio build ... portaudio_macos_arm.tar.gz", two `[debug] redirecting to https://release-assets.githubusercontent.com/...` lines printed by the downloader before `Logger.configure` runs; then silence while playing |
| 2 (warm cache) | same | 0 | 34 s | **0 bytes of output** |
| 3 (variant, scratchpad copy) | same script with `content_format: Membrane.MPEGAudio` added to the source and the `:DOWN` reason printed | 0 | 34 s | `pipeline down: :normal` |

Evidence that the audio really played for the whole file rather than the pipeline finishing early:
the file is 33.04 s (`ffprobe -hide_banner assets/bbb.mp3`: "Duration: 00:00:33.04 ... mp3, 44100 Hz,
stereo, 128 kb/s"), the warm run took 34 s with a 0-byte log, and the PortAudio sink pulls data only
as the device consumes it (`flow_control: :manual`, demand issued from `{:portaudio_demand, size}`
messages, `sink.ex:120-123`), so the sink can only reach end of stream after the last sample has
been handed to the device. Nobody listened to the speaker during the run; if the author wants an
ear check, run it once on the recording machine.

The pipeline terminates on its own: `handle_element_end_of_stream(:sink, ...)` fired and
`terminate: :normal` brought the pipeline process down with reason `:normal` (run 3). No hang.
The tail of the audio sits in the sink's ring buffer (`ringbuffer_size` default 4096 frames,
`sink.ex:50-55`, about 93 ms at 44.1 kHz) when the sink receives end of stream; teardown calls
`Pa_StopStream` then `Pa_CloseStream` [`deps/membrane_portaudio_plugin/c_src/membrane_portaudio_plugin/pa_helper.c:121-141`].
Whether the last tenth of a second is audible was not measured; the file ends in silence anyway,
so nothing to say on camera.

### C.3 Line-by-line verification of the spec

| Line | Verified where |
|---|---|
| `use Membrane.Pipeline` | `deps/membrane_core/lib/membrane/pipeline.ex:9` ("To create a pipeline, use `use Membrane.Pipeline`"); defaults injected at `:546-586` |
| `def handle_init(_ctx, _opts)` | `pipeline.ex:121-122`; returns `{[Action.common_actions()], state()}` |
| `child(:source, %Membrane.File.Source{location: "input.mp3"})` | `children_spec.ex:378-383`; `location` option `spec: Path.t() \| :stdin`, no default, `source.ex:17-20`; `Path.expand` is applied, `source.ex:73`, so "input.mp3" is relative to the cwd, hence "run from inside the example directory" |
| `\|> child(:decoder, Membrane.MP3.MAD.Decoder)` | `children_spec.ex:403-411`; module `deps/membrane_mp3_mad_plugin/lib/membrane_mp3_mad_plugin/decoder.ex:1`; no options needed (no `def_options` in the file) |
| `\|> child(:sink, Membrane.PortAudio.Sink)` | module `sink.ex:1`; all options have defaults: `device_id: :default` (`sink.ex:31-40`), `ringbuffer_size: 4096`, `portaudio_buffer_size: 256`, `latency: :high` (`sink.ex:50-67`) |
| `{[spec: spec], %{}}` | `action.ex:87`; `slides.md:412` |
| `handle_element_end_of_stream(:sink, _pad, _ctx, state)` → `{[terminate: :normal], state}` | `pipeline.ex:212-217`; `action.ex:179`; `slides.md:602-612` |
| catch-all clause `{[], state}` | mirrors the default at `pipeline.ex:582` |
| `{:ok, _supervisor, pipeline} = Membrane.Pipeline.start_link(Mp3Player)` | `pipeline.ex:91-93, 330-332`; `pipeline_options` defaults to `nil` |
| `Process.monitor` + `receive {:DOWN, ...}` | plain OTP; same shape as `youtube/01-codecs/example/mp3_to_mp4.exs` |

Link compatibility, pad by pad (all at stream-format time, see B.9): source `:output`
`%RemoteStream{type: :bytestream, content_format: nil}` matches the decoder's
`any_of(RemoteStream, MPEGAudio)` (the `RemoteStream` branch); decoder `:output`
`%RawAudio{sample_format: :s24le, sample_rate: 44100, channels: 2}` matches the sink's
`%RawAudio{sample_format: format} when format in [..., :s24le, ...]`. Numbers 44100 and 2 come from
`ffprobe` on the asset and the decoder reads them from the frames [`decoder.ex:120-126`].

### C.4 Decision: no `content_format: Membrane.MPEGAudio` on the source

The brief suggested `content_format: Membrane.MPEGAudio`. It was left out, and run 3 shows that
adding it changes nothing. Reasons:

- The decoder's input pad accepts `RemoteStream` as such [`decoder.ex:14`], and its
  `handle_stream_format` ignores whatever arrives [`decoder.ex:32-35`]. The option would be a
  decoration, and a line-by-line walkthrough would then have to explain a line that does nothing
  here. (The Transcoder is different: it needs to know what is inside the byte stream, which is why
  episodes 01 and 02 carry the option. That claim must not be transplanted to this episode.)
- With the option, the source still sends `%RemoteStream{..., content_format: Membrane.MPEGAudio}`
  [`source.ex:103-104`], not a `%Membrane.MPEGAudio{}` struct, so a sentence like "now the format is
  MPEG audio, which the decoder accepts" would be false; the match is still on the `RemoteStream`
  branch.
- Fewer identifiers in a 6-7 minute episode whose topic is elements and pads, not MP3.

If the author prefers the option on the slide for continuity with episodes 01 and 02, add
`, content_format: Membrane.MPEGAudio` to the source struct in both the slide and the script (run 3
proves it runs) and say only "we also tell the source what kind of bytes it reads; some elements
further down want to know", nothing stronger.

### C.5 Fallback that was not needed

`Membrane.File.Source` → `Membrane.Transcoder` (`output_stream_format: %Membrane.Transcoder.OutputFormat.RawAudio{}`)
→ `Membrane.PortAudio.Sink` was not built, because the direct decoder → sink link works and shows the
three kinds of elements with three real elements. `Membrane.FFmpeg.SWResample.Converter` was not
needed either (B.8).

---

## D. What a viewer with no multimedia background is likely to misunderstand

1. "A pipeline runs the stages one after another, like a shell pipeline over a whole file." No: all
   elements are alive at the same time, each a process, and data moves in small chunks; the file
   source reads 2 KB at a time while the sink is already playing (A.10, B.3).
2. "An element is a function call." It is a process with a mailbox and its own state; linking two
   elements means the first one sends messages to the second (B.3). Do not go further than this
   sentence: mailboxes filling up is episode 08.
3. "Source means 'file' and sink means 'speaker'." Source and sink are defined by the direction of
   their pads only. A camera, a microphone, a network socket and a generator are all sources; a file
   writer, a screen, a WebRTC sender are all sinks (B.4, A.8).
4. "A filter filters something out." In this vocabulary a filter is any element with inputs and
   outputs: a decoder, an encoder, a muxer, a parser (B.4; `slides.md:375`). The decoder in the example
   adds data (compressed in, raw out) and is still a filter.
5. "A decoder plays the sound." The decoder only turns MP3 frames into raw samples; the sound card is
   driven by the sink. "Play" belongs to the last box, not the middle one (B.8).
6. "GStreamer's 'source pad' is the same as Membrane's source." In GStreamer a source pad is an
   *output* pad. Avoid the GStreamer pad words entirely on camera (A.7).
7. "Pads are checked when you write the spec / at compile time / when the elements are linked." The
   format check happens when the first stream format travels through the link, at run time; what the
   spec stage checks is that no static pad is left unlinked (B.9).
8. "The format on a pad is the file extension or the codec name." It is a struct, e.g.
   `%RawAudio{sample_format: :s24le, sample_rate: 44100, channels: 2}`, and the pad declares a
   pattern over such structs (B.7, B.8). One sentence at most; raw audio is its own episode.
9. "The pipeline knows when the file is finished and stops." It does not; the end of stream is a
   signal that travels down the graph element by element, and the pipeline module decides what it
   means. The example stops when the sink reports it (B.11, B.12).
10. "`start_link` returns `{:ok, pid}` like every GenServer." It returns `{:ok, supervisor_pid,
    pipeline_pid}` (B.13).
11. "`child` creates the process right there." `child` only builds a description; the processes are
    spawned when the callback returns the `:spec` action (`slides.md:574, 590`; B.12).
12. "`membrane_core` contains the decoders." The core has no codec, file or audio device code; every
    element in the example comes from a plugin, and each plugin wraps one library or domain (B.14).
13. "Membrane only does audio" (from this example) or "only video" (from the thumbnails of 01 and
    02). Say once that the same three kinds of elements and the same spec describe video pipelines;
    the muxing example of episode 02 is one.
14. "The Transcoder from the other episodes is an element too." It is a component built from
    elements (B.15); call it a component, never an element, and do not call it a Bin.

---

## E. Depth limit for this episode (from the brief and SKILL §10)

No flow control (`flow_control: :manual`, demand, `demand_unit: :bytes` are visible in the quoted
pad definitions; do not read them aloud), no bins, no dynamic pads (`availability`), no `via_in` /
`via_out` (the example has none), no callbacks beyond `handle_init/2` and
`handle_element_end_of_stream/4`, no `Membrane.Endpoint` beyond the hedge in B.5, no buffers or
stream-format structs beyond one sentence, no `Membrane.Pad.ref`, no notifications.
