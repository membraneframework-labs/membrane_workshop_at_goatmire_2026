# Episode 04 · What raw audio and video look like in memory: fact sheet

Researcher notes for `youtube/04-raw-audio-and-video/scenario.md` (CONCEPT, up to 7 minutes, raw
video **and** raw audio, no colour inversion, no custom element). Everything below was checked
against the sources in the order of authority from `.claude/skills/episode-scenario/SKILL.md` §1:
slides, Chapter 2 and 3 materials, `origin/chapter-2-checkpoint`, plugin source in `deps/`,
`ffprobe`/`ffplay`/`xxd` on the assets and on the files the example writes. Paths are relative to
the repo root unless absolute. Versions actually in `deps/`: `membrane_core 1.3.4`,
`membrane_file_plugin 0.17.5`, `membrane_ivf_plugin 0.9.2`, `membrane_transcoder_plugin 0.5.0`,
`membrane_raw_video_format 0.4.5`, `membrane_raw_audio_format 0.12.3`,
`membrane_ffmpeg_swscale_plugin 0.16.5`, `membrane_ffmpeg_swresample_plugin 0.21.0`,
`membrane_mp3_mad_plugin 0.18.7`, `membrane_vpx_plugin 0.4.4`. The example was **run** on
2026-11-02 (section C and D); `Mix.install` resolved `membrane_core 1.3.5` for the script, the
rest identical.

Numbering note: the brief names this episode 04 and the directory is `04-raw-audio-and-video`.
`youtube/README.md:56-57` still lists 04 as "Describing a pipeline" and 05 as "What a video frame
looks like in memory"; SKILL §10 says to confirm numbering with the author. Not touched here.

---

## A. The concept in plain statements

1. A raw video stream is a series of images called frames, and you get each frame as a binary,
   exactly as it sits in memory. To read it you need two things: the resolution and the pixel
   format. [slide "Raw video and RGB", `presentation/slides.md:713-716`; `materials/Chapter 2/DEEP_DIVE.md:27-32`]
2. The resolution maps the flat binary onto rows: pixels are laid out row by row, the top row
   first, left to right. With `n` bytes per pixel, the pixel at column `x`, row `y` starts at byte
   `(y * width + x) * n`: skip `y` full rows of `width` pixels, then `x` more pixels.
   [`slides.md:721-725`; DEEP_DIVE "Resolution", `DEEP_DIVE.md:34-58`]
3. The pixel format says what those bytes mean. RGB is three bytes per pixel, one each for red,
   green and blue, 0 to 255; the slide's 2 × 2 frame is twelve bytes `[1 … 12]`, the first three are
   the top-left pixel. [`slides.md:730-743`; DEEP_DIVE "Pixel format", `DEEP_DIVE.md:60-93`;
   `deps/membrane_raw_video_format/lib/membrane_raw_video.ex:123-126`: `frame_size` for `:RGB` is
   `width * height * 3`]
4. Most decoders do not hand you RGB. They give you YUV, and the usual layout is I420: first the
   brightness of every pixel (the Y plane, one byte per pixel, a full-size greyscale picture), then
   the colour in two planes (U and V) stored for every 2 × 2 block of pixels, so each colour plane
   is a quarter of the size. That is 1 + 0.25 + 0.25 = 1.5 bytes per pixel, half of RGB, and both
   dimensions must be even. Source, quoted from `membrane_raw_video.ex:106-113`:
   ```elixir
   def frame_size(format, width, height)
       when format in [:I420, :YV12, :NV12, :NV21] and Integer.is_even(width) and
              Integer.is_even(height) do
     # Subsampling by 2 in both dimensions
     # Y = width * height
     # V = U = (width / 2) * (height / 2)
     {:ok, div(width * height * 3, 2)}
   end
   ```
   [also `slides.md:1153`: "I420 (planar YUV 4:2:0, another raw pixel format, different from RGB)";
   `xxd` of the file the example writes shows the Y plane first and the U plane starting exactly at
   byte 129 600 = 480 × 270, section D]
   **Scope:** "brightness at full resolution, colour at a quarter" is the whole story for this
   episode. *Why* it is done that way (the eye is more sensitive to brightness than to colour) is
   not written anywhere in the repo or the deps [UNVERIFIED from repo sources; standard textbook
   knowledge; one clause at most, or drop]. Colour science, chroma siting, HDR, limited vs full
   range are out (SKILL §10, row 05).
5. "Most decoders give you YUV" is supported by what is in this project: the VP8/VP9 decoder emits
   one of `[:I420, :I422, :I444, :NV12, :YV12]` (`deps/membrane_transcoder_plugin/lib/transcoder/video.ex:56, 280, 287`);
   the H.264/H.265 FFmpeg decoders `[:I420, :I422]` (`video.ex:57, 309, 320`); this clip came out
   `:I420` (observed stream format, section D), and ffprobe reports `yuv420p` for both video assets
   (section B). The SDL player accepts only I420 (`deps/membrane_sdl_plugin/lib/membrane_sdl/player.ex:20`;
   `slides.md:1169`). Say "the decoders you meet give you YUV, usually I420", not "always".
6. There are many more pixel formats. `Membrane.RawVideo` knows 18 (`membrane_raw_video.ex:30-48`:
   I420, I422, I444, RGB, BGR, BGRA, RGBA, NV12, NV21, YV12, AYUV, YUY2 and six 10-bit variants);
   the FFmpeg swscale converter handles 10 of them (`deps/membrane_ffmpeg_swscale_plugin/lib/membrane_ffmpeg_swscale/converter.ex:11-21`).
   One sentence, "there are dozens", is enough.
7. Raw audio is a stream of samples: a number for the air pressure at one instant, taken at a
   constant rate. The sampling rate is constant by nature, each sample has a known size, so from a
   count of bytes you know a duration. [DEEP_DIVE Ch. 3 "Timestamps", `materials/Chapter 3/DEEP_DIVE.md:41-45`;
   `deps/membrane_raw_audio_format/lib/membrane_raw_audio.ex:352-367`, `time_to_bytes`/`bytes_to_time`]
   The two rates you meet: 44 100 Hz (both assets, section B; the only rate the MP3 encoder takes,
   `transcoder/audio.ex:53-57`) and 48 000 Hz (the only rate the Opus encoder takes, `audio.ex:47-51`;
   AAC takes a list from 8 000 to 96 000, `audio.ex:28-45`).
8. The sample format is the size and kind of the number. `Membrane.RawAudio.SampleFormat` lists 18
   (`deps/membrane_raw_audio_format/lib/membrane_raw_audio/sample_format.ex:15-34`): signed or
   unsigned integers of 8, 16, 24, 32 bits, floats of 32 or 64 bits, little- or big-endian.
   `:s16le` is a signed 16-bit little-endian integer (`sample_format.ex:50`), range −32 768 to
   32 767 (`membrane_raw_audio.ex:235-259`), and it is the common case: it is what the AAC and Opus
   encoders want (`audio.ex:29, 48`) and what the workshop asks for (`materials/Chapter 3/DEEP_DIVE.md:459-463`).
   Bytes per sample = bits / 8 (`membrane_raw_audio.ex:55-58`).
9. Channels are interleaved: left sample, right sample, left, right. The struct's own doc says it
   describes "a format of raw audio stream with interleaved channels" (`membrane_raw_audio.ex:4`).
   One sample for every channel at the same instant is called a *frame* in audio, and
   `frame_size = sample_size * channels` (`membrane_raw_audio.ex:60-68`): 4 bytes for 16-bit stereo.
   (Different meaning of "frame" than in video: see section E.)
10. Bytes per second of raw audio = sample rate × channels × bytes per sample. 44 100 × 2 × 2 =
    176 400 bytes per second; at 48 000 Hz, 192 000. [arithmetic; `membrane_raw_audio.ex:310-313,
    330-334`] One second of this clip's raw video (I420) is 4 860 000 bytes, about 27 times more.
11. Raw data carries no description of itself. There is no header: a raw file is the first frame's
    bytes from byte zero (`xxd`, section D), `file(1)` guesses "DOS executable" for the video and
    "Common Data Format" for the audio, and `ffprobe video.raw` without options fails with "Invalid
    pixel format" (section D). Whoever receives the bytes has to be told the format separately: on
    the command line for ffplay, and in Membrane as the **stream format**, a struct sent through the
    pad before the first buffer that every element downstream receives.
    [`deps/membrane_core/lib/membrane/stream_format.ex:1-16`; slide "Pads specification",
    `slides.md:798-806` (`accepted_format: %Membrane.RawVideo{pixel_format: :RGB}`)]
12. For raw video the stream format is `%Membrane.RawVideo{width, height, framerate, pixel_format,
    aligned}` (all five keys enforced, `membrane_raw_video.ex:55-64`); `aligned: true` means every
    buffer holds exactly one frame (`:50-53`). For raw audio it is `%Membrane.RawAudio{channels,
    sample_rate, sample_format}` (all three enforced, `membrane_raw_audio.ex:40-47`). The structs
    observed in the example's run, verbatim (section D):
    ```elixir
    %Membrane.RawVideo{width: 480, height: 270, framerate: nil, pixel_format: :I420, aligned: true}
    %Membrane.RawAudio{channels: 2, sample_rate: 44100, sample_format: :s16le}
    ```
    Note `framerate: nil`: the VP8 decoder's `framerate` option defaults to `nil`
    (`deps/membrane_vpx_plugin/lib/membrane_vpx/decoder/vp8_decoder.ex:9-15`; copied into the
    struct at `decoder/vpx_decoder.ex:50-56`) and the Transcoder does not set it. The pace comes
    from the buffers' timestamps (video buffers carry `pts` 0, 40 ms, 80 ms … from the IVF
    container; the audio buffers carry `pts: nil`, MP3 has no timestamps). Timestamps are episode
    07: one clause at most.
13. A buffer's payload is the raw bytes, nothing else: `%Membrane.Buffer{payload, pts, dts, metadata}`
    (`deps/membrane_core/lib/membrane/buffer.ex:18-25`). In the run: 812 video buffers of exactly
    194 400 bytes (one frame each); 1 266 audio buffers of 4 608 bytes each (1 152 frames = one
    decoded MP3 frame's worth, 26.1 ms; `@samples_per_frame 1152` in
    `deps/membrane_mp3_mad_plugin/lib/membrane_mp3_mad_plugin/decoder.ex:12`).
14. The Transcoder normally hides the raw step (it decodes and encodes internally, `slides.md:846`;
    SKILL §4 "Facts already verified"), but you can ask it for raw output with
    `%Membrane.Transcoder.OutputFormat.RawVideo{pixel_format: …}` (default `:any`,
    `deps/membrane_transcoder_plugin/lib/transcoder/output_format.ex:83-94`) and
    `%Membrane.Transcoder.OutputFormat.RawAudio{sample_format, sample_rate, channels}` (every
    field defaults to `:any`, `output_format.ex:131-144`). `:any` means "whatever the decoder
    produces, the next element must cope" (`output_format.ex:88-91`; `video.ex:335-336`;
    `audio.ex:273-274, 323-324`). This is the workshop's real usage: `chapter-2-checkpoint` asks
    for `RawVideo{pixel_format: :RGB}`, Chapter 3 for `RawVideo{pixel_format: :I420}` and
    `RawAudio{sample_format: :s16le, sample_rate: 44_100, channels: 2}`
    (`git show origin/chapter-2-checkpoint:lib/workshop_pipeline.ex`; `materials/Chapter 3/README.md:22-24, 86-89`).
15. What the Transcoder builds inside for this example (verified by reading, consistent with the
    observed formats):
    - VP8 in → `Membrane.VP8.Decoder` (`video.ex:275-280`) → `%Membrane.FFmpeg.SWScale.Converter{format: :I420,
      output_width: nil, output_height: nil}` (`video.ex:413-448`). The converter is added even
      when I420 is requested, because the decoder's *possible* formats `[I420, I422, I444, NV12,
      YV12]` are not a subset of `[I420]` (`video.ex:418-431`); when the frame is already I420 the
      converter passes it through untouched (`swscale/converter.ex:225-227`). With `:RGB`
      requested the same converter does the I420 → RGB conversion (`swscale/converter.ex:176-194`).
    - MP3 in → `Membrane.MP3.MAD.Decoder`, which always outputs `:s24le` at the file's rate and
      channel count (`audio.ex:241-246`; `mad_plugin/decoder.ex:3, 16, 122-126`) →
      `%Membrane.FFmpeg.SWResample.Converter{output_stream_format: %OutputFormat{sample_format: :s16le,
      sample_rate: :keep, channels: :keep}}` (`audio.ex:305-350`; the `OutputFormat` struct and its
      `:keep` semantics `deps/membrane_ffmpeg_swresample_plugin/lib/membrane_ffmpeg_swresample_plugin/converter.ex:15-28`;
      it supports `[:u8, :s16le, :s24le, :s32le, :f32le, :f64le]` and 1 or 2 channels, `:30-31`).
      Precisely: the MAD path reports its produced formats as `:any` for all three fields
      (`audio.ex:252-263`, a `RemoteStream` has none of those keys), so every field we fix in the
      output format ends up as a converter setting (`audio.ex:326-327, 337`), and fields left `:any`
      become `:keep`.
    - **The mono quirk from episode 02, explained by the same code:** for `OutputFormat.AAC` the
      consumed channels are `1..8` (`audio.ex:44`), produced is `:any`, so the resampler gets
      `List.first([1, 2, …])` = 1 channel (`audio.ex:337`). That is why MP3 → AAC came out mono.
      With raw output and `channels: 2` spelled out, the result is stereo (verified, section D).
16. With `%OutputFormat.RawAudio{}` (all defaults) the audio comes out as the decoder made it:
    `%Membrane.RawAudio{channels: 2, sample_rate: 44100, sample_format: :s24le}`, 8 750 592 bytes,
    no resampler (run on 2026-11-02, section D). So if the script shows the empty struct it must say
    "24-bit", not "16-bit". The example fixes `:s16le` so the 16-bit story and the ffplay `-f s16le`
    line are true.

---

## B. Numbers and asset facts

`ffprobe -hide_banner assets/bbb_vp8.ivf`:

```
Input #0, ivf, from 'assets/bbb_vp8.ivf':
  Duration: 00:00:32.48, start: 0.000000, bitrate: 254 kb/s
  Stream #0:0: Video: vp8 (VP80 / 0x30385056), yuv420p(progressive), 480x270, 25 tbr, 25 tbn
```

`ffprobe -count_frames`: `width=480 height=270 pix_fmt=yuv420p r_frame_rate=25/1 nb_read_frames=812`.

`ffprobe -hide_banner assets/bbb.mp3`:

```
Input #0, mp3, from 'assets/bbb.mp3':
  Duration: 00:00:33.04, start: 0.025057, bitrate: 128 kb/s
  Stream #0:0: Audio: mp3 (mp3float), 44100 Hz, stereo, fltp, 128 kb/s, start 0.025057
```

`ffprobe -count_frames`: `sample_rate=44100 channels=2 duration=33.041995 nb_read_frames=1266`.

File sizes: `bbb_vp8.ivf` 1 031 399 bytes, `bbb.mp3` 529 492 bytes.

Recomputed for 480 × 270 (all exact):

| Quantity | Value |
|---|---|
| pixels per frame | 480 × 270 = 129 600 |
| bytes per RGB frame | 129 600 × 3 = 388 800 |
| bytes per I420 frame | 129 600 × 1.5 = 194 400 (Y 129 600 + U 32 400 + V 32 400) |
| raw video per second at 25 fps | RGB 9 720 000 B/s (9.7 MB/s); I420 4 860 000 B/s (4.9 MB/s) |
| the whole clip, 812 frames | RGB 315 705 600 B; I420 157 852 800 B (both produced and measured, section D) |
| compression the VP8 file achieved | 157 852 800 / 1 031 399 ≈ 153 × (vs I420); ≈ 306 × vs RGB |
| raw audio per second, 16-bit stereo 44.1 kHz | 44 100 × 2 × 2 = 176 400 B/s |
| raw audio per second, 16-bit stereo 48 kHz | 192 000 B/s |
| the whole clip's audio | 1 266 MP3 frames × 1 152 = 1 458 432 sample frames = 33.07 s = 5 833 728 B (measured, section D) |
| compression the MP3 achieved | 5 833 728 / 529 492 ≈ 11 × |
| video : audio raw ratio per second (I420) | 4 860 000 / 176 400 ≈ 27.5 |
| one minute of this clip raw | I420 291.6 MB, RGB 583.2 MB |

1080p, already verified in SKILL §4 (reuse): 1920 × 1080 = 2 073 600 px; × 3 B = 6 220 800 B ≈
6.2 MB per RGB frame; × 30 fps = 186 624 000 B/s ≈ 187 MB/s; × 7 200 s ≈ 1.3 TB. New, same
arithmetic: an I420 1080p frame is 3 110 400 B ≈ 3.1 MB, 93.3 MB/s at 30 fps.

Where the audio byte count comes from: ffprobe's 33.04 s is the file's duration after the
decoder delay of 0.025 s (1 105 samples) is dropped; the MAD decoder emits all 1 266 frames
(33.07 s) and nothing trims the delay, so the raw file is 5 833 728 B, not 44 100 × 4 × 33.04 =
5 828 256 B. The difference is 5 472 B = 1 368 sample frames = 31 ms. The first samples are
dither-level noise around zero (`0, -1, 0, -1 …`), audible as nothing. Peak sample value in the
file: 22 567 of 32 767.

---

## C. The Membrane example: `example/ivf_mp3_to_raw.exs`

Decision I420 vs RGB for the video branch: **I420**. It is what the decoder produces anyway, so
the episode can say "this is the raw video as the decoder hands it over" and the file size shows
1.5 bytes per pixel. RGB would make the Transcoder convert silently (statement A.15), the file
would be twice the size, and the script would have to either hide that or explain it. Both play
in ffplay equally well (`-pixel_format yuv420p` vs `rgb24`, both verified). The RGB variant's size,
315 705 600 B, is in section D if the author prefers the three-bytes story on screen.

The script as it is on disk (run from inside `example/` with `elixir ivf_mp3_to_raw.exs`):

```elixir
Mix.install([
  {:membrane_core, "~> 1.3"},
  {:membrane_file_plugin, "~> 0.17.4"},
  {:membrane_ivf_plugin, "~> 0.9.0"},
  {:membrane_transcoder_plugin, "~> 0.5.0"}
])

Logger.configure(level: :error)

defmodule IvfMp3ToRaw do
  use Membrane.Pipeline

  @impl true
  def handle_init(_ctx, _opts) do
    spec = [
      child(:ivf_file_source, %Membrane.File.Source{location: "bbb_vp8.ivf"})
      |> child(:ivf_deserializer, Membrane.IVF.Deserializer)
      |> child(:video_transcoder, Membrane.Transcoder)
      |> via_out(:output,
        options: [
          output_stream_format: %Membrane.Transcoder.OutputFormat.RawVideo{pixel_format: :I420}
        ]
      )
      |> child(:raw_video_sink, %Membrane.File.Sink{location: "video.raw"}),

      child(:mp3_file_source, %Membrane.File.Source{
        location: "bbb.mp3",
        content_format: Membrane.MPEGAudio
      })
      |> child(:audio_transcoder, Membrane.Transcoder)
      |> via_out(:output,
        options: [
          output_stream_format: %Membrane.Transcoder.OutputFormat.RawAudio{
            sample_format: :s16le,
            sample_rate: 44_100,
            channels: 2
          }
        ]
      )
      |> child(:raw_audio_sink, %Membrane.File.Sink{location: "audio.raw"})
    ]

    {[spec: spec], %{finished_sinks: 0}}
  end

  @impl true
  def handle_element_end_of_stream(sink, _pad, _ctx, state)
      when sink in [:raw_video_sink, :raw_audio_sink] do
    state = %{state | finished_sinks: state.finished_sinks + 1}

    if state.finished_sinks == 2 do
      {[terminate: :normal], state}
    else
      {[], state}
    end
  end

  @impl true
  def handle_element_end_of_stream(_child, _pad, _ctx, state) do
    {[], state}
  end
end

{:ok, _supervisor, pipeline} = Membrane.Pipeline.start_link(IvfMp3ToRaw)
ref = Process.monitor(pipeline)

receive do
  {:DOWN, ^ref, :process, _pid, _reason} -> :ok
end
```

The `example/` directory holds the script, `bbb_vp8.ivf` and `bbb.mp3` copied from `assets/`, and
a `.gitignore` with `video.raw` and `audio.raw` (the root `.gitignore` covers only `result.mp4`;
`git check-ignore -v` confirmed the two outputs are ignored through the new file).

**Termination with two sinks.** The single-sink pattern of episodes 01 and 02 (`terminate: :normal`
on the sink's end of stream) would stop the pipeline when the first file is complete and cut the
other one short. The state is therefore `%{finished_sinks: 0}` instead of `%{}`, the first
`handle_element_end_of_stream` clause matches either sink by a guard and counts, and the
pipeline terminates when the count reaches two. That is the simplest truthful form I found; it
is the same shape as the two-sink variant in `youtube/02-containers/notes/facts.md` (section C.2)
and what `materials/Chapter 3/DEEP_DIVE.md:432` asks for ("terminate only after both … have
finished"). The slide can show it as is; the writer should say one sentence about it or leave the
callbacks off the slide and show only the spec, as episode 02 did.

Line-by-line verification (every identifier in the script):

| Identifier | File in `deps/` | Confirmed |
|---|---|---|
| `Membrane.File.Source` | `membrane_file_plugin/lib/membrane_file/source.ex:1` | exists; options `location` (required, `:17-20`), `content_format: module() \| nil`, default `nil` (`:38-45`); output `%RemoteStream{type: :bytestream}` (`:47`) |
| `content_format: Membrane.MPEGAudio` | `membrane_mpegaudio_format/lib/membrane_caps_audio_mpeg.ex:1`; `transcoder/audio.ex:76-80, 119-125` | the module exists; the Transcoder recognises MPEG audio from `RemoteStream.content_format` and always decodes it ("There is no MPEG audio parser") |
| `Membrane.IVF.Deserializer` | `membrane_ivf_plugin/lib/membrane_ivf/deserializer.ex:1, 18-22` | no options; input `%RemoteStream{content_format: IVF \| nil}`; output `any_of(AV1, VP8, VP9)` |
| `Membrane.Transcoder` | `membrane_transcoder_plugin/lib/transcoder.ex:1, 27, 94-121` | a `Membrane.Bin` (say "component", SKILL §4.7); input accepts audio/video formats or any `RemoteStream`; `:output` pad `:on_request` with option `output_stream_format` (default `:keep`) |
| `via_out(:output, options: [output_stream_format: …])` | `transcoder.ex:100-110`; same shape in episode 02's example | pad option confirmed |
| `%Membrane.Transcoder.OutputFormat.RawVideo{pixel_format: :I420}` | `transcoder/output_format.ex:83-94` | field `pixel_format: Membrane.RawVideo.pixel_format() \| :any`, default `:any`; `:I420` is in the list `membrane_raw_video.ex:30-48` |
| `%Membrane.Transcoder.OutputFormat.RawAudio{sample_format: :s16le, sample_rate: 44_100, channels: 2}` | `output_format.ex:131-144` | fields `sample_format`, `sample_rate`, `channels`, each `… \| :any`, default `:any`; `:s16le` in `sample_format.ex:18, 50` |
| what the video branch builds | `transcoder/video.ex:275-280, 335-339, 413-448` | `Membrane.VP8.Decoder` → `%Membrane.FFmpeg.SWScale.Converter{format: :I420}` (see A.15) |
| what the audio branch builds | `transcoder/audio.ex:241-246, 273-274, 305-350` | `Membrane.MP3.MAD.Decoder` (s24le) → `%Membrane.FFmpeg.SWResample.Converter{output_stream_format: %{sample_format: :s16le, sample_rate: :keep, channels: :keep}}` (see A.15); the converter accepts s24le in and 2 channels (`swresample …/converter.ex:30-31`) |
| `Membrane.File.Sink` | `membrane_file_plugin/lib/membrane_file/sink.ex:1, 24-29` | option `location: Path.t() \| :stdout`; input `accepted_format: _any`, so it takes raw video and raw audio alike |
| `handle_element_end_of_stream/4` | `membrane_core/lib/membrane/pipeline.ex:208-217` | callback signature `(child, pad, ctx, state)`; default does nothing (`:582`) |
| `terminate: :normal` | `membrane_core/lib/membrane/pipeline/action.ex:170-176` | graceful termination: children are asked to stop, then the pipeline exits |
| `Membrane.Pipeline.start_link/1`, `Process.monitor`, `receive :DOWN` | same tail as `youtube/01-codecs/example/mp3_to_mp4.exs:45-50` | returns `{:ok, supervisor, pipeline}` |
| `Mix.install` requirements | root `mix.exs:24-27` | same three-component requirements; the Transcoder brings vpx, mad, swscale, swresample transitively (`membrane_transcoder_plugin/mix.exs` deps list) |

Not used on purpose: `Membrane.RawAudioParser` (timestamps, episode 07), `Membrane.SDL.Player`
and `Membrane.PortAudio.Sink` (they would be the natural "play it" sinks, but the point of the
episode is that the bytes exist and are naked, which a file shows and a player hides), the
`ColorInverter` and two-Transcoder split (episode 06).

---

## D. Run record (2026-11-02, macOS arm64, Elixir 1.19.5 / OTP 28, ffmpeg from Homebrew)

All commands were run from inside `youtube/04-raw-audio-and-video/example/` unless noted.

1. `elixir ivf_mp3_to_raw.exs`, first run: `Mix.install` resolved and compiled the dependencies,
   natives included; exit 0. Wall time not recorded reliably (the log file was overwritten by a
   sibling process using the same scratchpad name) but it was on the order of a minute, with
   precompiled binaries downloaded for some natives. Tell the author to run it once on the
   recording machine beforehand.
2. `elixir ivf_mp3_to_raw.exs`, second run, outputs deleted first: **exit 0, 0.68 s, zero bytes
   on stdout and stderr** (the terminal stays empty on camera). Outputs byte-identical to the first
   run (`cmp`).
3. `ls -l`:
   ```
   -rw-r--r--  5833728  audio.raw
   -rw-r--r--  157852800  video.raw
   ```
   157 852 800 = 812 × 194 400 exactly; 5 833 728 = 1 266 × 1 152 × 4 exactly (section B).
4. Observed stream formats and buffers (same spec with a `Membrane.Debug.Filter` in front of each
   sink, run in the scratchpad, outputs byte-identical to the example's):
   ```
   VIDEO stream format: %Membrane.RawVideo{width: 480, height: 270, framerate: nil, pixel_format: :I420, aligned: true}
   AUDIO stream format: %Membrane.RawAudio{channels: 2, sample_rate: 44100, sample_format: :s16le}
   v: 812 buffers; payload sizes %{194400 => 812}; first pts [0, 40000000, 80000000]; last pts 32440000000
   a: 1266 buffers; payload sizes %{4608 => 1266}; first pts [nil, nil, nil]; last pts nil
   ```
   (`pts` in nanoseconds: 40 000 000 ns = 40 ms = one frame at 25 fps.)
5. Variant `%OutputFormat.RawAudio{}` (all `:any`): exit 0, 0.72 s,
   `%Membrane.RawAudio{channels: 2, sample_rate: 44100, sample_format: :s24le}`, 1 266 buffers of
   6 912 bytes, `audio.raw` 8 750 592 B = 1 266 × 1 152 × 2 × 3.
6. Variant `%OutputFormat.RawVideo{pixel_format: :RGB}` (video only): exit 0, ~1 s,
   `%Membrane.RawVideo{… pixel_format: :RGB …}`, `video.rgb` 315 705 600 B = 812 × 388 800; first
   bytes `fb fb fb …`; `ffprobe -f rawvideo -pixel_format rgb24 -video_size 480x270 -framerate 25`
   reports `rgb24, 480x270, 77760 kb/s, 32.48 s`.
7. `xxd video.raw | head -4` (I420):
   ```
   00000000: e9e9 e9e9 e9e9 e9e9 e9e9 e9e9 e9e9 e9e9  ................
   00000010: e9e9 e9e9 e9e9 e9e9 e9e9 e9e9 e9e9 e9e9  ................
   00000020: e9e9 e9e9 e9e9 e9e9 e9e9 e9e9 e9e9 e9e9  ................
   00000030: e9e9 e9e9 e9e9 e9e9 e9e9 e9e9 e9e9 e9e9  ................
   ```
   `xxd -s 129600 -l 32 video.raw` (start of the U plane): all `80`. `xxd -s 194400 -l 32`
   (start of frame 2): `e9` again. So the first frame is a flat light grey, Y = 0xE9 = 233 and
   U = V = 0x80 = 128 (neutral colour): **the first frame is not black and not a picture, it is the
   near-white fade-in Big Buck Bunny opens with.** Frame 0 to 2 are flat (Y 233 everywhere); from
   about frame 10 (0.4 s) faint structure appears; the "Peach Open Movie Project presents" title is
   fully visible around frame 100 (4 s); the scene darkens from frame 90 on. For an on-camera hex
   dump that shows "noise", seek into the file: `xxd -s $((194400 * 100)) video.raw | head`.
   For a still, `ffmpeg -f rawvideo -pixel_format yuv420p -video_size 480x270 -i video.raw -vf
   "select=eq(n\,100)" -frames:v 1 frame100.png` gives the title card. Reading the same file with
   `-video_size 481x270` shears the picture into diagonal bands with shifted colours (tried; a good
   picture for "the resolution is where the binary wraps").
8. `xxd audio.raw | head -4`:
   ```
   00000000: 0000 ffff 0000 ffff 0000 ffff 0000 ffff  ................
   00000010: ffff ffff ffff ffff 0000 ffff ffff 0000  ................
   00000020: 0000 0000 ffff 0000 0000 ffff ffff ffff  ................
   00000030: ffff ffff 0000 ffff ffff 0000 0000 0000  ................
   ```
   Pairs of bytes, little-endian: `0000` = 0, `ffff` = −1; left, right, left, right: silence with
   one bit of dither. One second in (`xxd -s 176400 -l 32 audio.raw`): `0ffe 9501 34fe fb01 …` =
   −497, 405, −460, 507 …, real signal, left and right alternating.
9. `file video.raw audio.raw`: "DOS executable (COM)" and "Common Data Format (Version 2.5 or
   earlier) data". Both wrong, as expected: nothing in the files says what they are.
10. ffprobe **without** the format: `ffprobe -hide_banner video.raw` → `[rawvideo] Invalid pixel
    format. Could not open codec for input stream 0`; `ffprobe -hide_banner audio.raw` → the same
    message (it guesses "rawvideo" from nothing). ffprobe **with** the format:
    ```
    ffprobe -hide_banner -f rawvideo -pixel_format yuv420p -video_size 480x270 -framerate 25 video.raw
      Duration: 00:00:32.48, start: 0.000000, bitrate: 38880 kb/s
      Stream #0:0: Video: rawvideo (I420 / 0x30323449), yuv420p, 480x270, 38880 kb/s, 25 tbr, 25 tbn
    ffprobe -hide_banner -f s16le -ar 44100 -ch_layout stereo audio.raw
      Duration: 00:00:33.07, bitrate: 1411 kb/s
      Stream #0:0: Audio: pcm_s16le, 44100 Hz, stereo, s16, 1411 kb/s
    ```
    (38 880 kb/s = 4 860 000 B/s × 8; 1 411 kb/s = 176 400 B/s × 8. Both match section B.)
11. ffplay, **verified on screen** (a window opened, played, exited with code 0; run with `-t 2` to
    keep the test short, the author drops `-t 2`):
    ```
    ffplay -hide_banner -autoexit -f rawvideo -pixel_format yuv420p -video_size 480x270 -framerate 25 video.raw
    ffplay -hide_banner -autoexit -f s16le -ar 44100 -ch_layout stereo audio.raw
    ```
    ffplay prints four harmless `No accelerated colorspace conversion found from yuv420p to bgr24`
    lines for the video; with `-loglevel error` they disappear. If the video branch were RGB the
    flag is `-pixel_format rgb24`. If the audio were the all-defaults variant it would be `-f s24le`.
12. Cleanup: `video.raw` and `audio.raw` deleted from `example/`; scratchpad copies deleted.
13. `git status --short` after all of this shows only the new, untracked
    `youtube/04-raw-audio-and-video/` (plus a sibling agent's `youtube/03-membrane-basics/example/`,
    not mine). Nothing tracked changed; nothing committed.

---

## E. What a first-time viewer (or the script) will get wrong

1. **"Frame" means two things.** In video a frame is one picture (194 400 or 388 800 bytes here).
   In raw audio a frame is one sample per channel at one instant (4 bytes for 16-bit stereo;
   `membrane_raw_audio.ex:60-68`), and an MP3 frame is 1 152 of those. If the episode uses the word
   for audio at all, say which one; safest is "picture" for video and "sample" for audio and never
   "audio frame".
2. **Sample vs sample rate.** A sample is one number; the sample rate is how many of them per
   second per channel. "44.1 kHz audio" says nothing about bit depth or channel count; all three are
   needed (A.12).
3. **A raw file has no header, none.** Not a small one, not a magic number. The first byte of
   `video.raw` is the top-left pixel's brightness. That is why ffplay needs four flags and why
   `file(1)` guesses nonsense (D.7-D.10). (Contrast with episode 02, where even IVF had 32 bytes.)
4. **Raw is not "uncompressed MP4" or "a .yuv codec".** There is no codec involved after the
   decoder; the bytes are the picture. ffprobe's "rawvideo" is a pseudo-codec name, not a format
   of the file.
5. **RGB is what the decoder gives you.** No: the decoders here give YUV (I420); RGB is what you
   convert to when you want to touch pixels as colours, and that conversion is a real step (the
   swscale converter, A.15). Say "most decoders", with the list in A.5 behind it.
6. **I420 is "lower quality" / "compressed".** It stores colour at a quarter resolution, which is
   a lossy choice, but it is still raw: fixed size per frame, no encoder, every byte addressable.
   Don't call it compression in the codec sense.
7. **1.5 bytes per pixel means every pixel is 1.5 bytes.** No pixel is 1.5 bytes; brightness is one
   byte per pixel and the colour bytes are shared by four pixels. The 1.5 is an average. Say it that
   way once.
8. **Bytes per second scales with resolution the way the viewer expects, but 480 × 270 is tiny.**
   4.9 MB/s here against 93 MB/s (I420) or 187 MB/s (RGB) at 1080p. If the episode shows 4.9 MB/s,
   immediately scale it up, or the viewer thinks raw video is manageable.
9. **The audio file is "33.04 s long because the MP3 was".** It is 33.07 s; the decoder emits the
   encoder's delay too (B). Don't read a duration off ffprobe of the MP3 and apply it to the raw file.
10. **Stereo is guaranteed because the MP3 is stereo.** Only because the example asks for
    `channels: 2`. The Transcoder's MP3 → AAC path makes mono (A.15); with raw output and defaults
    you get what the decoder made (stereo, but 24-bit). Spell the format out, every field.
11. **`framerate` is in the stream format, so Membrane "knows" 25 fps.** In this run it is `nil`
    (A.12); the pace lives in buffer timestamps, which come from the IVF container. Leave the
    details to episode 07, but don't claim the struct carries the frame rate here.
12. **ffplay shows a black frame first, so the decode is broken.** The first frames are flat
    light grey (Y = 233): a fade from white, not black and not a bug (D.7).
13. **Little-endian** will trip people who look at the hex: `0ffe` is −497, not 0x0FFE. If the
    hex dump of the audio is on screen, say "two bytes per number, low byte first" or avoid reading
    values aloud.

---

## F. Depth limits (SKILL §10, row 05, plus the brief)

Must not appear beyond a clause:

- Colour science: why YUV, BT.601/709 matrices, chroma siting, limited vs full range, HDR,
  10-bit formats. Allowed: "brightness for every pixel, colour for every two-by-two block".
- Other pixel formats by name beyond I420 and RGB (NV12, YUY2, planar vs packed). Allowed: "there
  are dozens".
- Colour inversion, `255 - value`, binary comprehensions, `handle_buffer`, pads, `accepted_format`:
  episode 06. The brief says no custom element and no inversion.
- Timestamps, `pts`, `Membrane.RawAudioParser`, Realtimer: episode 07. One clause: "the pace comes
  from timestamps, another episode".
- Flow control, `:manual` demand of the file sink: episode 08.
- What is inside the Transcoder (swscale, swresample, MAD, libvpx) by name. Allowed: "the
  Transcoder decodes and, if needed, converts to the format you asked for".
- Floating-point sample formats, 24-bit, endianness as a topic. Allowed: "16-bit integers are the
  common case; there are others".
- "Bin": `Membrane.Transcoder` is "a component".
- Playing the raw files inside Membrane (`SDL.Player`, `PortAudio.Sink`): the audio twin episode
  mentioned in SKILL §10 if it is ever made; here ffplay on camera does that job.

---

## G. Could not verify from repo sources

- The reason for chroma subsampling (human vision is more sensitive to brightness than colour):
  not in slides, materials or deps. Common knowledge; keep to one clause or drop.
- "Most decoders give you YUV" beyond the decoders in this project (VP8/VP9/H.264/H.265 paths,
  A.5): true in practice, but the repo only proves it for these.
- "44.1 kHz and 48 kHz are the common rates": the assets are 44.1 kHz, Opus requires 48 kHz,
  AAC lists both first (`audio.ex:30-35`); nothing in the repo ranks them. Safe as "the two you
  meet most".
- First-run wall time of `Mix.install` (log clobbered); on the order of a minute here with
  precompiled natives, longer on a machine that has to compile them.
