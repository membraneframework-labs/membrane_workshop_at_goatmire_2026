# Episode 02 · Containers, muxing and demuxing: fact sheet

Researcher notes for `youtube/02-containers/scenario.md`. Everything below was checked against the
sources in the order of authority from `.claude/skills/episode-scenario/SKILL.md` §1: slides,
Chapter 1 materials, `origin/chapter-1-checkpoint`, plugin source in `deps/`, `ffprobe`/`xxd` on the
assets. Paths are relative to the repo root unless absolute. Pinned versions actually in `deps/`:
`membrane_core 1.3.4`, `membrane_mp4_plugin 0.36.10`, `membrane_ivf_plugin 0.9.2`,
`membrane_file_plugin 0.17.5`, `membrane_transcoder_plugin 0.5.0`, `membrane_h264_format 0.6.1`,
`membrane_aac_format 0.8.1`, `membrane_mpegaudio_format 0.3.2`, `membrane_mp4_format 0.8.1`.

Both candidate Membrane examples (section C) were **run** on these versions on 2026-10-20 (scripts
and outputs in a temp dir outside the repo; the run created the gitignored `_build/`, nothing
tracked changed).

---

## A. The concept in plain statements

1. What comes out of an encoder (H.264, VP8, AAC, MP3) is just a stream of bytes; a container wraps
   one or more such streams with what a reader needs: where each frame starts, its timestamp, and
   which track it belongs to. [slide "Containers", `presentation/slides.md:164-167`; DEEP_DIVE
   "The process", `materials/Chapter 1/DEEP_DIVE.md:51-62`]
2. The codec is *how* the media is compressed; the container is *how* the streams are packaged.
   These are two independent questions. [slide "Containers" pills, `slides.md:186-196`]
3. The streams inside a container are called tracks; MP4 holds many of them: video, audio,
   subtitles. [`slides.md:172`; `DEEP_DIVE.md:55-56`; `assets/bbb_ad_multitrack.mp4` has two H.264
   and two AAC tracks per ffprobe and `BONUS_TASKS.md:47-49`]
4. IVF is a very simple container for a single video stream (VP8, VP9 or AV1): a 32-byte file
   header starting with the signature `DKIF`, then for every frame a 12-byte header (4-byte frame
   size, 8-byte timestamp) followed by the frame bytes. [`slides.md:171`;
   `deps/membrane_ivf_plugin/lib/membrane_ivf/headers.ex:8-10, 46-49, 59-69, 113, 121-124`;
   codec FourCC → `VP8`/`VP9`/`AV1` in `deps/membrane_ivf_plugin/lib/membrane_ivf/deserializer.ex:53-62`]
5. MP3 does not need a container: every MP3 frame starts with a 4-byte header that says what the
   frame is (MPEG version, layer, bitrate, sample rate, padding), and the frame length follows from
   that header, so the encoded stream can go straight into a file. [`slides.md:178`;
   `DEEP_DIVE.md:31-32`; `deps/membrane_mpegaudio_format/lib/membrane_caps_audio_mpeg.ex:79-83`
   (`header_size/0` = 4) and `:102-124` (`frame_size/1` computed from header fields); the sync bytes
   `0xFF 0xFB` open the silent frame at `:134` and the first frame of `assets/bbb.mp3` at offset 148]
6. Muxing (multiplexing) is merging several streams into one, interleaved and synchronized.
   [slide "Muxing and demuxing", `slides.md:256-263`; `DEEP_DIVE.md:51-56`]
7. The interleaving is literal: the ISOM muxer collects about one second of samples per track
   (`chunk_duration`, default `Membrane.Time.seconds(1)`) and writes those chunks alternately,
   "a bit of video, a bit of audio", which the source says helps players.
   [`deps/membrane_mp4_plugin/lib/membrane_mp4/muxer/isom.ex:49-59`]
8. Demuxing is the reverse: whatever reads the stream, for example a media player, splits it back
   into distinct, synchronized streams and hands each to its decoder. [`slides.md:274-278`;
   `DEEP_DIVE.md:58-62`]
9. Timestamps usually come from the container: a plain H.264 stream has none, MP4 has one for every
   sample, IVF has one per frame, MP3 has none. [slide "Where timestamps come from", `slides.md:959`;
   `slides.md:1266`; `headers.ex:47-48`; `deserializer.ex:111` turns the IVF timestamp into `pts`]
   (Depth limit: one sentence at most, timestamps are episode 07.)
10. Containers also carry codec configuration. For H.264 in MP4 the parameter sets (SPS/PPS) are
    stored once, out of band, in a Decoder Configuration Record, and the NAL units in the stream are
    prefixed with their length instead of the Annex B start code `00 00 01`. That is the difference
    between `stream_structure: :annexb` and `{:avc1, dcr}`. [`deps/membrane_h264_format/lib/membrane_h264_format/h264.ex:57-72`]
11. In the MP4 structure the H.264 configuration sits in the `avcC` box inside a sample entry named
    `avc1` (or `avc3`), and the AAC configuration, the Elementary Stream Descriptor, sits in the
    `esds` box inside the `mp4a` sample entry; both live in the `stsd` (sample description) table.
    [`deps/membrane_mp4_plugin/lib/membrane_mp4/container/schema_default.ex:189-220`;
    `deps/membrane_mp4_plugin/lib/membrane_mp4/movie_box/sample_table_box.ex:64-96, 131-150, 312-338`;
    `deps/membrane_aac_format/lib/membrane_aac_format/aac.ex:45-51` (esds = ISO/IEC 14496-14)]
12. That is exactly why the MP4 muxer insists on H.264 with `stream_structure: {:avc1 | :avc3, dcr}`
    and `alignment: :au`, and on AAC with `config: {:esds, _}` (it also takes H.265 and Opus), and
    why the Transcoder is asked for `:avc1` and `:esds`. [`muxer/isom.ex:14-29`; `slides.md:655`;
    `materials/Chapter 1/README.md:40`; `DEEP_DIVE.md:334-338`]
13. `ffprobe` prints those sample-entry names right next to the codec: `h264 (Constrained Baseline)
    (avc1 / 0x31637661)` and `aac (LC) (mp4a / 0x6134706D)`. Note: `mp4a`, not `esds`, is what
    ffprobe shows for audio; `esds` is one level deeper. [ffprobe, section B]
14. An MP4 file begins with an `ftyp` box whose major brand is `isom`; the muxer writes
    `isom` with compatible brands `isom iso2 avc1 mp41`. [`xxd -l 32 assets/bbb_h264_aac.mp4`;
    ffprobe `major_brand: isom`; `muxer/isom.ex:10`] The expansion "ISO Base Media File Format"
    (ISO/IEC 14496-12) is standard knowledge and not written anywhere in the repo or deps
    [UNVERIFIED from repo sources; would need the spec or hexdocs; safe to say, but see F].
15. In Membrane, `Membrane.File.Source` emits a `%RemoteStream{type: :bytestream, content_format: …}`
    where `content_format` is whatever the option says (type `module() | nil`, default `nil`); an
    MP3 file has no container to announce itself, so the source must be told
    `content_format: Membrane.MPEGAudio`, otherwise the Transcoder cannot pick a decoder. MP4 and
    IVF files need no such hint, because the demuxer and the deserializer accept
    `content_format: nil` and read the file header. [`deps/membrane_file_plugin/lib/membrane_file/source.ex:38-45, 101-106`;
    `slides.md:653`; `README.md:37`; `deps/membrane_transcoder_plugin/lib/transcoder/audio.ex:119-125`;
    `deps/membrane_mp4_plugin/lib/membrane_mp4/demuxer/isom.ex:35-39`; `deserializer.ex:18-19`]
16. `Membrane.IVF.Deserializer` is the demuxer for IVF: bytes in, a `%Membrane.VP8{width, height}`
    (or VP9/AV1) stream out, one buffer per frame with `pts`. [`deserializer.ex:18-22, 53-76, 107-116`;
    `slides.md:654`]
17. `Membrane.MP4.Muxer.ISOM` takes one or many input tracks (input pad `availability: :on_request`)
    and outputs an MP4 byte stream; options `fast_start` (default `false`, so `moov` is written after
    `mdat`) and `chunk_duration` (default 1 s). [`muxer/isom.ex:14-59`; `DEEP_DIVE.md:102`]
18. `Membrane.MP4.Demuxer.ISOM` has one input and `:on_request` output pads with a `kind:` option
    (`:video | :audio | nil`, default `nil`); the number of output pads must equal the number of
    tracks; pads are linked either before playing (with `kind:` when there is more than one track)
    or after the `{:new_tracks, [{track_id, format}]}` notification, as `Pad.ref(:output, track_id)`.
    [`demuxer/isom.ex:1-24, 41-64, 85-93, 445, 523-535, 555-569`; verified by running, section C]
19. The same length-prefixed H.264 is used by QuickTime (.mov), MP4, Matroska and FLV; Annex B is
    what you write to a bare file or into MPEG-TS. Membrane has a Matroska muxer/demuxer plugin
    (not a dependency of this project). [`h264.ex:60-68`; `deps/membrane_core/README.md:246`]
    "WebM is a Matroska profile" [UNVERIFIED from repo sources; common knowledge; keep to one clause
    or drop].
20. "IVF" is expanded as "Indeo Video Format" only in `DEEP_DIVE.md:28`; no plugin source confirms
    it and SKILL §2 bans etymology asides anyway. Do not expand the acronym on air.

---

## B. Numbers and asset facts

File sizes (`ls -l assets/`):

| File | Bytes | ffprobe duration |
|---|---|---|
| `assets/bbb_h264_aac.mp4` | 3 897 173 | 00:00:33.04 |
| `assets/bbb_vp8.ivf` | 1 031 399 | 00:00:32.48 |
| `assets/bbb.mp3` | 529 492 | 00:00:33.04 |
| `assets/bbb_ad_multitrack.mp4` | 6 849 326 | 00:00:33.04 |

`ffprobe -hide_banner assets/bbb_h264_aac.mp4` (condensed, exact stream lines):

```
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'assets/bbb_h264_aac.mp4':
  major_brand: isom, compatible_brands: isomiso2avc1mp41, encoder: Lavf56.40.100
  Duration: 00:00:33.04, start: 0.000000, bitrate: 943 kb/s
  Stream #0:0[0x1](eng): Video: h264 (Constrained Baseline) (avc1 / 0x31637661), yuv420p(tv, smpte170m/smpte170m/bt709, progressive), 480x270, 824 kb/s, 25 fps, 25 tbr, 19200 tbn (default)
  Stream #0:1[0x2](eng): Audio: aac (LC) (mp4a / 0x6134706D), 44100 Hz, stereo, fltp, 127 kb/s (default)
```

`ffprobe -hide_banner assets/bbb_vp8.ivf`:

```
Input #0, ivf, from 'assets/bbb_vp8.ivf':
  Duration: 00:00:32.48, start: 0.000000, bitrate: 254 kb/s
  Stream #0:0: Video: vp8 (VP80 / 0x30385056), yuv420p(progressive), 480x270, 25 tbr, 25 tbn
```

`ffprobe -hide_banner assets/bbb.mp3`:

```
Input #0, mp3, from 'assets/bbb.mp3':
  Duration: 00:00:33.04, start: 0.025057, bitrate: 128 kb/s
  Stream #0:0: Audio: mp3 (mp3float), 44100 Hz, stereo, fltp, 128 kb/s, start 0.025057
```

(The MP3 carries an ID3v2 tag of 148 bytes before the first frame, which is why ffprobe shows
`major_brand: isom` metadata copied by the encoder; the first frame header is at byte 148:
`ff fb 50 00`. The MAD decoder skips the ID3 tag: `deps/membrane_mp3_mad_plugin/lib/membrane_mp3_mad_plugin/decoder.ex:76-94`.)

`ffprobe -hide_banner assets/bbb_ad_multitrack.mp4`:

```
  Duration: 00:00:33.04, start: 0.000000, bitrate: 1658 kb/s
  Stream #0:0[0x1](eng): Video: h264 (Constrained Baseline) (avc1 / 0x31637661), yuv420p(...), 480x270, 824 kb/s, 25 fps, 25 tbr, 19200 tbn (default)
  Stream #0:1[0x2](und): Video: h264 (High) (avc1 / 0x31637661), yuv420p(...), 480x270, 1543 kb/s, 25 fps, 25 tbr, 12800 tbn
  Stream #0:2[0x3](eng): Audio: aac (LC) (mp4a / 0x6134706D), 44100 Hz, stereo, fltp, 127 kb/s (default)
  Stream #0:3[0x4](und): Audio: aac (LC) (mp4a / 0x6134706D), 44100 Hz, stereo, fltp, 138 kb/s
```

Top-level MP4 box order (own scan of the files):

- `bbb_h264_aac.mp4`: `ftyp@0:32  free@32:8  mdat@40:3874997  moov@3875037:22136`. **Not
  fast-start** (moov after mdat). The index (`moov`) is 22 136 bytes = 0.57 % of the file; the
  media (`mdat`) is 99.4 %. The strings `avc1`, `avcC`, `mp4a`, `esds`, `stsd`, `trak` all sit inside
  that `moov` at the end of the file (offsets 3 875 466, 3 875 552, 3 882 576, 3 882 612).
- `bbb_ad_multitrack.mp4`: `ftyp@0:32  moov@32:29874  free@29906:8  mdat@29914:6819412`: fast-start.
- The first 32 bytes of `bbb_h264_aac.mp4`: `0000 0020 6674 7970 6973 6f6d 0000 0200 6973 6f6d 6973 6f32 6176 6331 6d70 3431`
  = box size 32, `ftyp`, major brand `isom`, minor version 512, compatible brands `isom iso2 avc1 mp41`.

`xxd -l 64 assets/bbb_vp8.ivf`:

```
00000000: 444b 4946 0000 2000 5650 3830 e001 0e01  DKIF.. .VP80....
00000010: 1900 0000 0100 0000 2c03 0000 0000 0000  ........,.......
00000020: 1901 0000 0000 0000 0000 0000 1021 009d  .............!..
00000030: 012a e001 0e01 0047 0885 8588 8584 8802  .*.....G........
```

Decoded with the layout in `headers.ex:59-69` and `:46-49` (all little-endian):

| Offset | Bytes | Meaning |
|---|---|---|
| 0-3 | `44 4b 49 46` | signature `DKIF` |
| 4-5 | `00 00` | version 0 |
| 6-7 | `20 00` | header length 32 |
| 8-11 | `56 50 38 30` | codec FourCC `VP80` |
| 12-13 | `e0 01` | width 480 |
| 14-15 | `0e 01` | height 270 |
| 16-19 | `19 00 00 00` | timebase denominator (rate) 25 |
| 20-23 | `01 00 00 00` | timebase numerator (scale) 1 → one tick = 1/25 s |
| 24-27 | `2c 03 00 00` | frame count 812 |
| 28-31 | `00 00 00 00` | unused |
| 32-35 | `19 01 00 00` | first frame header: frame size 281 bytes |
| 36-43 | `00…00` | first frame timestamp 0 |
| 44- | `10 21 00 9d 01 2a e0 01 0e 01 …` | first VP8 frame (281 bytes) |

Recomputed: 812 frames / 25 fps = 32.48 s, matches ffprobe; `ffprobe -count_frames` also reports
812. Container overhead of IVF: 32 + 812 × 12 = 9 776 bytes of headers in 1 031 399 bytes, under
1 %. (The bytes `9d 01 2a` then `e0 01`/`0e 01` inside the first frame are the VP8 key-frame start
code and the 480×270 dimensions; that comes from RFC 6386, not from anything in the repo
[UNVERIFIED here; nice-to-have only, not needed for the episode].)

Arithmetic for MP3: 128 kb/s × 33.04 s / 8 = 528 640 bytes ≈ file size minus the 148-byte tag.
One MPEG-1 Layer III frame at 44.1 kHz holds 1 152 samples (`membrane_caps_audio_mpeg.ex:94`), so
the file is about 1 265 self-describing frames of ~418 bytes.

Output of the checkpoint mux pipeline when run today (`result.mp4`, 8 322 239 bytes, 33.09 s):
`Video: h264 (Constrained Baseline) (avc1 / 0x31637661) … 480x270 … 25 fps`,
`Audio: aac (LC) (mp4a / 0x6134706D), 44100 Hz, mono, 93 kb/s`. Note **mono**: the Transcoder's
MP3 → AAC path produced one channel here, so the script must not call the produced file "stereo"
(the *asset* `bbb_h264_aac.mp4` is stereo).

---

## C. The Membrane example

### C.1 The checkpoint spec (mux): MP3 + VP8-in-IVF → MP4 with AAC + H.264

Verbatim from `git show origin/chapter-1-checkpoint:lib/workshop_pipeline.ex` (the `spec` and the
termination callbacks; module boilerplate omitted):

```elixir
spec = [
  child(:ivf_file_source, %Membrane.File.Source{location: "assets/bbb_vp8.ivf"})
  |> child(:ivf_deserializer, Membrane.IVF.Deserializer)
  |> child(:video_transcoder, Membrane.Transcoder)
  |> via_out(:output,
    options: [
      output_stream_format: %Membrane.Transcoder.OutputFormat.H264{stream_structure: :avc1}
    ]
  )
  |> child(:mp4_muxer, Membrane.MP4.Muxer.ISOM)
  |> child(:mp4_file_sink, %Membrane.File.Sink{location: "result.mp4"}),
  child(:mp3_file_source, %Membrane.File.Source{
    location: "assets/bbb.mp3",
    content_format: Membrane.MPEGAudio
  })
  |> child(:audio_transcoder, Membrane.Transcoder)
  |> via_out(:output,
    options: [
      output_stream_format: %Membrane.Transcoder.OutputFormat.AAC{config: :esds}
    ]
  )
  |> get_child(:mp4_muxer)
]

{[spec: spec], %State{}}
```

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

**Run today on the pinned versions: terminates with `:normal`, produces a valid MP4 (see B).**

Line-by-line verification:

| Identifier | File in `deps/` | Confirmed |
|---|---|---|
| `Membrane.File.Source` | `membrane_file_plugin/lib/membrane_file/source.ex:1` | exists; `use Membrane.Source` |
| `location:` | `source.ex:17-20` | `Path.t() \| :stdin`, required (no default) |
| `content_format:` | `source.ex:38-45` | `module() \| nil`, default `nil`; copied into `%RemoteStream{content_format: …}` at `:101-106` |
| (unused) `chunk_size:` | `source.ex:21-25` | default 2048 bytes; `seekable?` default `false` (`:26-37`) |
| `Membrane.IVF.Deserializer` | `membrane_ivf_plugin/lib/membrane_ivf/deserializer.ex:1` | exists, no options (`handle_init(_ctx, _options)`, `:38`); input accepts `%RemoteStream{content_format: IVF \| nil}` (`:18-19`); output `any_of(AV1, VP8, VP9)` (`:21-22`) |
| `Membrane.Transcoder` | `membrane_transcoder_plugin/lib/transcoder.ex:1` | exists; it is a `Membrane.Bin` (`:27`), call it "component" per SKILL §4.6; input accepts audio/video formats or any `RemoteStream` (`:94-98`); `:output` pad is `:on_request` with option `output_stream_format` (default `:keep`) (`:100-120`) |
| `via_out(:output, options: [output_stream_format: …])` | `transcoder.ex:100-110` | pad option name confirmed; same shape used in the Transcoder moduledoc (`:19-25`) |
| `%Membrane.Transcoder.OutputFormat.H264{stream_structure: :avc1}` | `transcoder/output_format.ex:39-50` | fields `alignment: :au` (default), `stream_structure: :annexb` (default); allowed `:annexb \| :avc1 \| :avc3 \| {:avc1 \| :avc3, nalu_length_size}` |
| what `:avc1` makes the Transcoder build | `transcoder/video.ex:456-466` | after the encoder it adds `%Membrane.H264.Parser{output_alignment: …, output_stream_structure: :avc1}` whenever the requested structure is not `:annexb` |
| `Membrane.MP4.Muxer.ISOM` | `membrane_mp4_plugin/lib/membrane_mp4/muxer/isom.ex:1` | exists; input `:on_request`, accepts `%Membrane.AAC{config: {:esds, _}}`, `%Membrane.H264{stream_structure: {_avc, _dcr}, alignment: :au}`, H265, Opus (`:14-29`); output `%RemoteStream{type: :bytestream, content_format: MP4}` (`:31-33`); options `fast_start: false`, `chunk_duration: 1 s` (`:35-59`) |
| `Membrane.File.Sink` | `membrane_file_plugin/lib/membrane_file/sink.ex:1` | exists; option `location: Path.t() \| :stdout` (`:24-27`); accepts any format (`:29`); handles the muxer's `SeekSinkEvent` (moduledoc `:7-11`, required by `muxer/isom.ex:44-46` only when `fast_start: true`) |
| `Membrane.MPEGAudio` | `membrane_mpegaudio_format/lib/membrane_caps_audio_mpeg.ex:1` | exists; why it is needed: `transcoder/audio.ex:119-125` ("There is no MPEG audio parser, so decoding and re-encoding is the only way"); `output_format.ex:222-230` resolves the format from `RemoteStream.content_format` |
| `%Membrane.Transcoder.OutputFormat.AAC{config: :esds}` | `output_format.ex:96-111` | fields `config: nil` (default; allowed `:audio_specific_config \| :esds \| {:esds, avg, max} \| nil`), `encapsulation: :none` (default; `:none \| :ADTS` per `aac.ex:17-21`) |
| what `:esds` makes the Transcoder build | `transcoder/audio.ex:276-283` | `Membrane.AAC.FDK.Encoder` then `%Membrane.AAC.Parser{output_config: :esds, out_encapsulation: :none}` |
| MP3 in → what the Transcoder builds | `transcoder/audio.ex:241-246` | `Membrane.MP3.MAD.Decoder` → raw audio → (encoder above) |
| VP8 in → what the Transcoder builds | `transcoder/video.ex:276-279, 376-382` | `Membrane.VP8.Decoder` → raw video → `Membrane.H264.FFmpeg.Encoder` → H264.Parser (avc1) |
| `get_child(:mp4_muxer)` | `materials/Chapter 1/DEEP_DIVE.md:194-209` | links a second branch to an already defined child; both muxer inputs are dynamic (`:on_request`) so no pad name is needed |
| `handle_element_end_of_stream/4` → `{[terminate: :normal], state}` | `DEEP_DIVE.md:301-322` | the workshop's way to stop; verified by the run |

Three "container lines" the episode would point at: `content_format: Membrane.MPEGAudio` (no
container to announce the format), `stream_structure: :avc1`, `config: :esds` (the container's
preferred codec-configuration shape).

### C.2 Second candidate: demuxing `assets/bbb_h264_aac.mp4` with `Membrane.MP4.Demuxer.ISOM`

Design constraints found in the source, all relevant to how small the example can be:

- The demuxer needs **all** tracks linked: "Number of pads has to be equal to the number of
  demuxed tracks" (`demuxer/isom.ex:11`; enforced at `:445-447`). You cannot "just take the audio"
  from a two-track file; the video needs a destination too.
- Two ways to link (`isom.ex:8-24`): (a) in the same spec, before playing, each pad with
  `kind: :video | :audio` (`BONUS_TASKS.md:20-38` shows exactly this); (b) spawn only source +
  demuxer, wait for `{:new_tracks, [{track_id, format}]}` and link `Pad.ref(:output, track_id)`
  (`isom.ex:85-93`, `BONUS_TASKS.md:60-67`). If any pad is linked before playing, the notification
  is **not** sent (`isom.ex:18-20`, `:523`).
- Input: `%RemoteStream{type: :bytestream, content_format: nil | MP4}` (`isom.ex:35-39`), so
  `Membrane.File.Source` needs no `content_format` for an MP4.
- Fast start: the moduledoc says moov must precede mdat (`isom.ex:5`), but the option doc says a
  non-fast-start file still works with the whole `mdat` held in memory (`isom.ex:66-83`).
  `bbb_h264_aac.mp4` is not fast-start (section B) and **it worked** with default options (3.9 MB in
  memory). For big files you would set `optimize_for_non_fast_start?: true` plus
  `%File.Source{seekable?: true}`; not for this episode.
- Where the tracks go: writing bare `.h264`/`.aac` files is bad practice per SKILL §4.5, so the
  natural destination is the Chapter 1 bonus task (`BONUS_TASKS.md:8-16`): video → Transcoder →
  VP8 → `Membrane.IVF.Serializer` → `.ivf`; audio → Transcoder → MP3 → `.mp3` **with no container**
  (which nicely restates statement A.5). That needs `Membrane.VP8.Encoder`
  (`deps/membrane_vpx_plugin/lib/membrane_vpx/encoder/vp8_encoder.ex:1`, output `VP8`) and
  `Membrane.MP3.Lame.Encoder` (`deps/membrane_mp3_lame_plugin/lib/membrane_mp3_lame/encoder.ex:1`),
  both already transitive deps of the Transcoder (`transcoder/video.ex:344`, `transcoder/audio.ex:297-299`).
- `Membrane.IVF.Serializer` (`deps/membrane_ivf_plugin/lib/membrane_ivf/serializer.ex:1-56`):
  options `width`/`height` (default `nil`, taken from the stream format), `timebase` (default
  `{1, 1_000_000_000}`), `frame_count` (default `:dynamic`, needs `Membrane.File.Sink` because it
  seeks back to patch the header); input accepts `VP8`/`VP9`/`AV1` structs.
- Two sinks means the pipeline must count two end-of-streams before terminating (the checkpoint's
  single-sink pattern does not transfer 1:1).

**Variant (a), pads linked up front with `kind:` (RUN, terminates `:normal`, outputs probe as
`vp8 (VP80) 480x270 25 fps`, 812 frames, and `mp3 44100 Hz stereo 192 kb/s 33.04 s`):**

```elixir
defmodule DemuxPipeline do
  use Membrane.Pipeline

  @impl true
  def handle_init(_ctx, _opts) do
    spec = [
      child(:mp4_file_source, %Membrane.File.Source{location: "bbb_h264_aac.mp4"})
      |> child(:mp4_demuxer, Membrane.MP4.Demuxer.ISOM)
      |> via_out(:output, options: [kind: :video])
      |> child(:video_transcoder, Membrane.Transcoder)
      |> via_out(:output,
        options: [output_stream_format: %Membrane.Transcoder.OutputFormat.VP8{}]
      )
      |> child(:ivf_serializer, Membrane.IVF.Serializer)
      |> child(:ivf_file_sink, %Membrane.File.Sink{location: "video.ivf"}),
      get_child(:mp4_demuxer)
      |> via_out(:output, options: [kind: :audio])
      |> child(:audio_transcoder, Membrane.Transcoder)
      |> via_out(:output,
        options: [output_stream_format: %Membrane.Transcoder.OutputFormat.MPEGAudio{}]
      )
      |> child(:mp3_file_sink, %Membrane.File.Sink{location: "audio.mp3"})
    ]

    {[spec: spec], %{finished_sinks: 0}}
  end

  @impl true
  def handle_element_end_of_stream(sink, _pad, _ctx, state)
      when sink in [:ivf_file_sink, :mp3_file_sink] do
    state = %{state | finished_sinks: state.finished_sinks + 1}
    if state.finished_sinks == 2, do: {[terminate: :normal], state}, else: {[], state}
  end

  @impl true
  def handle_element_end_of_stream(_element, _pad, _ctx, state), do: {[], state}
end
```

(Run with `assets/` prefixes and an absolute output dir; the paths above are shortened the same
way the old draft shortened them. `via_out(:output, options: …)` on an `:on_request` pad is the
same construct the checkpoint uses on the Transcoder, and `BONUS_TASKS.md:29-37` uses it on the
demuxer.)

**Variant (b), `:new_tracks` notification (RUN, terminates `:normal`, same outputs):**

```elixir
  @impl true
  def handle_init(_ctx, _opts) do
    spec =
      child(:mp4_file_source, %Membrane.File.Source{location: "bbb_h264_aac.mp4"})
      |> child(:mp4_demuxer, Membrane.MP4.Demuxer.ISOM)

    {[spec: spec], %{finished_sinks: 0}}
  end

  @impl true
  def handle_child_notification({:new_tracks, tracks}, :mp4_demuxer, _ctx, state) do
    spec =
      Enum.map(tracks, fn
        {track_id, %Membrane.H264{}} ->
          get_child(:mp4_demuxer)
          |> via_out(Pad.ref(:output, track_id))
          |> child(:video_transcoder, Membrane.Transcoder)
          |> via_out(:output,
            options: [output_stream_format: %Membrane.Transcoder.OutputFormat.VP8{}]
          )
          |> child(:ivf_serializer, Membrane.IVF.Serializer)
          |> child(:ivf_file_sink, %Membrane.File.Sink{location: "video.ivf"})

        {track_id, %Membrane.AAC{}} ->
          get_child(:mp4_demuxer)
          |> via_out(Pad.ref(:output, track_id))
          |> child(:audio_transcoder, Membrane.Transcoder)
          |> via_out(:output,
            options: [output_stream_format: %Membrane.Transcoder.OutputFormat.MPEGAudio{}]
          )
          |> child(:mp3_file_sink, %Membrane.File.Sink{location: "audio.mp3"})
      end)

    {[spec: spec], state}
  end
```

The notification as actually received from this file (abridged binaries):

```elixir
{:new_tracks,
 [
   {1, %Membrane.H264{width: 480, height: 270, alignment: :au,
                      stream_structure: {:avc1, <<1, 66, 224, 21, 255, 225, 0, 24, 39, 66, 224, 21, …>>}}},
   {2, %Membrane.AAC{sample_rate: 44100, channels: 2, mpeg_version: 2, samples_per_frame: 1024,
                     encapsulation: :none, config: {:esds, <<3, 128, 128, 128, 34, 0, 2, 0, 4, …>>}}}
 ]}
```

(`Pad.ref` is available because `use Membrane.Pipeline` requires and aliases `Membrane.Pad`,
`deps/membrane_core/lib/membrane/pipeline.ex:501, 515-516`. The `handle_child_notification/4`
callback signature: `pipeline.ex:174-179`. The bytes `1, 66, 224, 21` are the DCR header: profile
66 = Baseline, constraint flags, level 21; the SPS NAL follows: this *is* "the parameter sets in the
container", visible.)

**Verification status:** both variants are verified to run correctly on the pinned versions
(`membrane_mp4_plugin 0.36.10`, `membrane_transcoder_plugin 0.5.0`, `membrane_ivf_plugin 0.9.2`,
`membrane_core 1.3.4`) against `assets/bbb_h264_aac.mp4`, today, end to end.

**Complexity for a 5-7 minute episode:** variant (a) is 9 children in two branches plus a two-sink
termination counter; walked top to bottom at the author's pace that is about 60-80 s, about the
same as the mux example, and it introduces three more identifiers (`kind:`, `IVF.Serializer`,
`OutputFormat.MPEGAudio`). Variant (b) additionally needs `handle_child_notification`, `Pad.ref`
and the idea of dynamic pads, which `youtube/README.md:64` assigns to episode 12 and SKILL §10 keeps
out of episode 02 ("bins, dynamic pads, notifications" are episode 12's topic). Variant (b) is out.

### C.3 Recommendation

Show **one** complete example, the checkpoint mux spec (C.1), walked top to bottom. Reasons:

1. It already contains both directions of the concept: `IVF.Deserializer` *is* a demuxer (a
   one-track container coming apart), `MP4.Muxer.ISOM` is the muxer, and the MP3 source is the
   "no container" case. The three container lines (`content_format`, `:avc1`, `:esds`) tie
   straight back to the ffprobe output from the cold open (`avc1`).
2. It is the workshop's real code, approved for episode 01 in a trimmed form; the viewer who saw
   01 recognises it, the viewer who did not loses nothing.
3. SKILL §9: if the draft runs long, the second example goes first. A CONCEPT episode's Membrane
   part is ~30 % of 5-6 minutes, which is one example.

Mention `Membrane.MP4.Demuxer.ISOM` in one or two spoken sentences ("there is a demuxer too, it
reads the index, tells you which tracks it found and gives you one output per track"), no code.
If the author wants demuxing on screen, use variant (a) (verified) and drop the "three lines"
walkthrough of C.1 to stay in budget; never variant (b).

---

## D. What a first-time viewer will misunderstand

1. "MP4 is a codec / MP4 compresses video." MP4 is a container; the compression is done by the
   codec inside it (H.264, AAC), and ffprobe shows no "mp4" codec anywhere.
2. "MP4 always means H.264 + AAC." MP4 can hold H.265, Opus, several video tracks, subtitles; the
   muxer here accepts H.264, H.265, AAC and Opus (`muxer/isom.ex:14-29`), and the multitrack asset
   has four tracks.
3. ".mp3 is a container like .mp4." MP3 is a codec whose frames each carry their own header, so the
   bare stream is the file; there is no separate container layer (which is also why the file source
   has to be told what is inside).
4. "H.264 in MKV is a different H.264 than in MP4." It is the same coded pictures; only the
   packaging differs (and in both cases the length-prefixed `avc` form with out-of-band parameter
   sets, `h264.ex:65-68`).
5. "The muxer compresses / re-encodes." A muxer only interleaves and indexes the already-encoded
   bytes; the container overhead is under 1 % for IVF and about 0.6 % for this MP4 (section B).
6. "Demuxing decodes." Demuxing only splits the file back into the encoded streams and hands them
   to the decoders; after the demuxer you still have H.264 and AAC, not pixels and samples.
7. "Converting to MP4 is one operation." It may be a remux (change the box, keep the codecs) or a
   transcode (change the codecs), and "convert this to MP4" does not say which.
8. "A container is just a file extension." Renaming `.mkv` to `.mp4` changes nothing inside; the
   player reads the `ftyp`/`DKIF` signature, not the name.
9. "The container is only for files." MPEG-TS and fragmented MP4 are used for streaming; one
   clause ("there are variants for streaming") and no more, per F.
10. "`avc1` is a codec and `h264` is the container", reading the ffprobe line backwards. `h264` is
    the codec, `avc1` is the name of the MP4 sample entry that holds its configuration.
11. "Tracks are synchronized because they are the same length." They are synchronized because every
    sample carries a timestamp from the container (one sentence, episode 07 has the rest).

---

## E. Candidate on-screen graphics

1. `02-bytes-no-boundaries`: one long strip of identical grey bytes, no marks, caption "an encoded
   stream is just bytes".
2. `02-bytes-with-container` (build-up on the same strip): frame boundaries appear, then a timestamp
   above each frame, then a track colour per frame; caption "boundaries · timestamps · tracks".
3. `02-codec-vs-container`: two cards side by side, "Codec: how it is compressed" / "Container: how
   the streams are packaged" (the two pills from the slide).
4. `02-three-containers`: three cards, "MP4: many tracks, everywhere", "IVF: one video track, 32-byte
   header + 12 bytes per frame", "MP3: no container, each frame has its own header".
5. `02-ivf-header`: the 64 hex bytes from section B with coloured spans labelled DKIF, VP80, 480,
   270, 25 fps, 812 frames, then the first frame header "281 bytes, t = 0" (generated, not a
   terminal screenshot; mono font).
6. `02-mux`: the slide's mux diagram, H.264 and AAC dashed streams into a solid "MP4 muxer" box, MP4
   out; optionally a second step showing the interleaved chunks V A V A V A.
7. `02-demux`: the reverse diagram, MP4 in, demuxer box, H.264 and AAC out, each arrow ending at a
   small "decoder" box.
8. `02-where-config-lives`: two mini stacks, "stream with parameter sets inside (Annex B)" vs "MP4
   header holds them once (avc1 → avcC)" and "mp4a → esds" for audio; keep it to the names, no box
   tree.
9. `02-ffprobe-callback`: the two ffprobe stream lines with `h264` / `avc1` and `aac` / `mp4a`
   highlighted (rendered text, same style as other overlays; a real terminal full-frame at 1920×1080
   is the alternative).
10. `02-pipeline`: the Task 1 diagram from `slides.md:632-640` in the overlay vocabulary: two dashed
    inputs, File.Source ×2, IVF.Deserializer, Transcoder ×2, MP4.Muxer.ISOM, File.Sink, dashed
    `result.mp4`; a build-up version highlighting the three container-related spots.
11. `02-container-overhead`: a bar showing 99.4 % media (`mdat`) vs 0.6 % index (`moov`) for the MP4
    asset; optional, only if the "muxer doesn't compress" point gets a sentence.
12. `02-takeaway`: one line, "codec = compression, container = packaging; mux in, demux out".

---

## F. Depth limits (SKILL §10, row 02: "MP4 box structure, fragmented MP4, HLS/CMAF")

Must not appear beyond naming where the configuration lives:

- The MP4 box tree (`ftyp`/`moov`/`mdat`/`trak`/`stsd`/`stbl`, sample tables, chunk offsets,
  timescales). Allowed: "the MP4 header stores the H.264 parameter sets once, in a box called
  `avc1`" and "the AAC config in `esds`"; nothing about `moov`/`mdat` order.
- Fast start / `moov` placement, `fast_start: true`, `optimize_for_non_fast_start?`, seeking.
- Fragmented MP4, CMAF, HLS, DASH, MPEG-TS internals. One clause at most: "there are variants of
  MP4 made for streaming."
- WebM/Matroska internals (EBML); just name them as other containers.
- Annex B vs AVC byte-level details (start codes, NAL length prefixes, DCR layout). Allowed: "the
  parameter sets either travel inside the stream or sit once in the container header; the muxer
  wants the second shape."
- ADTS, AudioSpecificConfig, the `{:esds, avg, max}` form.
- Timestamps, PTS/DTS, timebases (episode 07): one sentence that the container carries them.
- Dynamic pads, `:new_tracks`, `handle_child_notification`, `Pad.ref` (episode 12); `kind:` only if
  variant (a) of C.2 is shown.
- The spec syntax itself (`child`, `via_out`, `get_child`, actions, callbacks): episode 04. Read the
  code as "every line is one box", as episode 01 did.
- What the Transcoder builds inside (parsers, FDK, MAD, FFmpeg): episode 01 territory; one sentence
  "the Transcoder knows how to produce that shape" is enough.
- "Bin": do not use the word; `Membrane.Transcoder` is "a component".
- Etymology: not "Indeo", not "ISO Base Media File Format" as a history lesson; "ISOM" may be
  explained in half a sentence only if the author keeps the "that's why the module is called ISOM"
  line.
