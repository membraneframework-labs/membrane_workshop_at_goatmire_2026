# 02 · MP4 is not a video format: containers, muxing and demuxing

| | |
|---|---|
| Type | CONCEPT |
| Length | 7-8 min |
| SEO title | "MP4 vs H.264: what is a container? Muxing and demuxing explained (Multimedia 101 #2)" |
| Keywords | mp4 vs h264, what is a container format, muxing, demuxing, mkv vs mp4, codec vs container, what is muxing |
| Source | Ch. 1 slides "Containers", "Muxing and demuxing", the "Task 1" pipeline diagram and the elements table; DEEP_DIVE Ch. 1 "The process" and the Transcoder hints; the finished Ch. 1 pipeline; `notes/facts.md` for every verified detail |
| On screen | Overlays from `images/` (see `images/README.md` for the file ↔ timestamp map): the two ffprobe stream lines (twice, with different highlights), a strip of bytes that gains boundaries, timestamps and tracks in three steps, the codec/container cards, the three containers, the IVF header decoded, the mux and demux diagrams, the two shapes of H.264, the pipeline diagram with its three container spots highlighted in three steps, the takeaway. Code comes from the Keynote presentation. |

## Facts that must land (drafting checklist, delete before recording if you like)

- MP4 is not a codec. "MP4" says how the streams are packaged, not how they are compressed.
- An encoded stream is just bytes. A container adds: where each frame starts, its timestamp, which track it belongs to.
- MP4: many tracks, seekable, plays everywhere. IVF: one video track, a 32-byte header plus 12 bytes per frame. MP3: needs no container, every frame has its own header.
- Muxing = interleaving streams into one container, with timestamps, so a player can keep them in sync. Demuxing = the reverse, the first thing every player does. Neither touches the compression; the container overhead here is about half a percent.
- Containers often hold codec configuration. For H.264 in MP4 the parameter sets sit once in the header (`avc1`), so the same H.264 comes in two shapes and the muxer insists on one. AAC's config sits in `esds`.
- In Membrane: `Membrane.IVF.Deserializer` (a demuxer for a one-track container), `Membrane.MP4.Muxer.ISOM`, `Membrane.MP4.Demuxer.ISOM`. An MP3 file source must be told `content_format: Membrane.MPEGAudio`. The transcoders are asked for `:avc1` and `:esds` because that is what the muxer wants.

---

## Version A (detailed)

**[0:00] Cold open. On camera. Overlay `01-ffprobe.png`: the two stream lines of an MP4 file as ffprobe prints them, "h264" and "aac" highlighted.**

> This is an MP4 file, and this is what a tool called ffprobe says about it. Stream zero is video,
> encoded with H.264. Stream one is audio, encoded with AAC. There is no "MP4 compression" anywhere
> in here. So if MP4 doesn't compress anything, what does it actually do? That's what this episode
> is about.

**[0:20] Bumper**

**[0:25] On camera**

> In this video I'll explain what a multimedia container is, why MP4 is not a codec, and what 
> muxing and demuxing mean. At the end I'll show you how it looks in Membrane, an open-source multimedia
> framework for Elixir.

**[0:40] Overlay `02-bytes-1.png`: a long strip of identical bytes with no marks. Then `02-bytes-2.png`, `-3.png`, `-4.png` as the frame boundaries, the timestamps and the track colours appear, one per sentence.**

> Let's start with what comes out of an encoder, the program that compresses video or audio. It
> gives you a stream of bytes, and if I just hand you that stream, you'll run into a few problems.
> Where does one frame end and the next one begin? When should each frame be shown? And if I also
> give you the audio, how do you know which bit of audio goes with which frame?

> A container answers those questions. It wraps the encoded streams with the information a reader
> needs: where each frame starts, what its timestamp is, and which track it belongs to. Tracks are
> simply the streams inside the container: video, audio, maybe subtitles.

**[1:30] Overlay `03-codec-vs-container.png`: two cards, "Codec: how the media is compressed" and "Container: how the streams are packaged".**

> So these are two separate questions. The codec is how the media is compressed. The container is
> how the streams are packaged. You can have H.264 in MP4, H.264 in MKV, VP8 in WebM, any
> combination the container allows. And when somebody asks you to "convert this to MP4", it's worth
> asking which part they mean: repackaging is quick, re-encoding is a different job.

**[1:55] Overlay `04-three-containers.png`: three cards, MP4, IVF, MP3. For the IVF card, switch to `05-ivf-header.png`: the first 48 bytes of an IVF file, with the signature, codec, width, height, frame rate, frame count and the first frame header coloured and labelled.**

> Let's look at three examples. MP4 is the container you meet everywhere. It can hold many tracks,
> you can jump to any point in the file, and almost every device can play it. It's an ISO standard,
> which is why you'll see "ISOM" in library names.

> IVF is on the opposite end. It holds a single video stream, VP8, VP9 or AV1. The file starts with
> a 32-byte header, and then every frame gets 12 bytes in front of it: the size of the frame and a
> timestamp. Here are the first bytes of such a file: the signature and the codec name, then the
> picture size, 480 by 270, the frame rate, 25 frames per second, the number of frames, 812, and
> then the header of the first frame, which is 281 bytes long. The whole container adds less than
> one percent to the file.

> And MP3 doesn't need a container at all. Every MP3 frame starts with its own small header that
> says what kind of frame it is, and from that you know how long it is, so the encoded stream can go
> straight into a file. That's why ".mp3" is the name of both the codec and the file.

**[3:15] Overlay `06-mux.png`: H.264 and AAC streams going into an "MP4 muxer" box, MP4 coming out. Then `07-interleaved.png`: the output drawn as alternating chunks, video, audio, video, audio.**

> Putting streams into a container is called muxing. The muxer takes the H.264 stream and the AAC
> stream and interleaves them: a chunk of video, the matching chunk of audio, the next chunk of
> video, and so on. Each piece gets its timestamp, so a player can read the file from the beginning
> and keep both in sync. The muxer doesn't compress anything: in the MP4 file from the start, the
> container is about half a percent of the size, the rest is the encoded media, untouched.

**[3:50] Overlay `08-demux.png`: MP4 going into an "MP4 demuxer" box, H.264 and AAC coming out, each arrow ending at a small decoder box.**

> Demuxing is the reverse, and it's the first thing every media player does. It opens the file,
> reads the table that says where every frame is, splits the file back into the separate streams,
> and hands each one to its decoder. After the demuxer you still have H.264 and AAC, not pictures
> and sound.

**[4:10] Overlay `09-two-shapes.png`: the same H.264 drawn twice, once with the parameter sets repeated in front of the frames, once with them stored once in the MP4 header, labelled "avc1".**

> There's one more thing containers do, and you'll run into it the first time you try to put H.264
> into an MP4 yourself. Some codecs need a few settings before the decoder can start. For H.264
> those are the parameter sets, which describe the resolution and the encoding options. They can
> travel inside the stream, in front of the frames, or sit once in the container header, which is
> what MP4 normally does. So the same H.264 comes in two shapes, and a muxer insists on the shape it
> was designed for.

**[4:50] Overlay `01-ffprobe-entries.png`: the ffprobe lines again, this time with "avc1" and "mp4a" highlighted.**

> Remember the ffprobe output from the beginning? Next to "h264" it said "avc1". That's the name of
> the entry in the MP4 header where this configuration lives. The audio line has "mp4a" in the same
> spot, and inside that entry the AAC configuration sits in a box called "esds".

**[5:05] Overlay `10-pipeline-1.png`: the pipeline diagram, two files in, one MP4 out, every element a box.**

> So how does this look in Membrane? In Membrane, you build a media application as a pipeline: a
> chain of elements, where each element does one thing with the stream and passes it on. Here is a
> pipeline that takes an MP3 file and a VP8 video in an IVF file, and produces one MP4 with AAC and
> H.264 inside. Every box is one element, and three of these elements deal with containers.

**[5:35] Overlays `10-pipeline-2.png`, `-3.png`, `-4.png`: the IVF deserializer, then the MP4 muxer, then the MP3 source highlighted, one per sentence.**

> The IVF deserializer unpacks the VP8 stream from the IVF file, so it's a demuxer for a one-track
> container. The MP4 muxer puts the AAC and the H.264 together into one MP4. And the MP3 file source
> is the no-container case.

**[5:55] Keynote presentation: the code. Walk through it top to bottom.**

```elixir
spec = [
  child(:ivf_file_source, %Membrane.File.Source{location: "bbb_vp8.ivf"})
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
    location: "bbb.mp3",
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
```

> Here's the same pipeline as code, top to bottom. Every box from the diagram is one element here,
> and some of them carry options. The first element reads the IVF file. The second one, the IVF
> deserializer, takes the container apart and gives us the plain VP8 stream. Then a Transcoder turns
> VP8 into H.264, and notice the option: stream structure avc1. That's the shape the MP4 muxer
> wants, with the parameter sets kept aside for the header. Then comes the MP4 muxer, that's the
> ISOM from earlier, and a file sink that writes the result to disk.

> The second branch starts with the MP3 file, and this is the no-container case in practice. There's
> no container header to announce the format, and the file source doesn't look inside the bytes, so
> we tell it ourselves: the content format is MPEG audio. Then a Transcoder turns MP3 into AAC, with
> config esds, again the shape the muxer wants. And the last line plugs this branch into the same
> muxer as the video.

> Three options in this code are there only because of containers: the content format on the MP3
> source, avc1 on the video, and esds on the audio. The syntax itself is a topic for another
> episode.

**[7:15] Overlay `11-takeaway.png`.**

> So, the codec is how the media is compressed, and the container is how the streams are packaged. A
> muxer puts streams into a container, a demuxer takes them out, and neither of them touches the
> compression. In the next episode we'll look at what a Membrane pipeline is actually made of:
> elements, pads, and how they connect. See you there.

**[7:40] End**

---

## Version B (room for you)

**Hook, pick one:**

1. ffprobe on an MP4: "there is no MP4 compression in here". End on "so what does MP4 actually do?"
2. `[YOU: the question you get most often from people outside multimedia: "can you convert this to MP4?" and how you answer it]`
3. Rename `movie.mp4` to `movie.mkv` and open it. `[YOU: what happens in your player and why]` Only if you've tried it.

**Beats:**

1. An encoded stream is just bytes. You don't know where a frame starts, when to show it, or whose it is.
2. A container adds boundaries, timestamps and tracks. Tracks are the streams inside.
3. Codec versus container, two questions. "Convert to MP4" needs the follow-up "which part?"
4. Three examples: MP4 (everywhere, many tracks, ISO standard, hence "ISOM"), IVF (one video track, 32-byte header, 12 bytes per frame, show the hex), MP3 (no container, each frame has its own header). `[YOU: a container you like or can't stand, MPEG-TS, MKV, and why]`
5. Muxing: interleave with timestamps so a player keeps the streams in sync. The muxer doesn't compress; the container is about half a percent of this file.
6. Demuxing: the reverse, the first thing a player does. After it you still have encoded streams.
7. Codec configuration inside the container: parameter sets in the stream or once in the header. Two shapes of H.264, the muxer insists on one. Callback to "avc1" in the ffprobe output; "esds" for AAC.
8. In Membrane: two-sentence intro of Membrane, the pipeline diagram, the three container elements (the IVF deserializer, which is a demuxer; the MP4 muxer; the MP3 source as the no-container case), optionally one sentence that an MP4 demuxer exists. Then the code from Keynote, top to bottom, ending on the three container options: `content_format`, `:avc1`, `:esds`.
9. Takeaway, then next: what a pipeline is made of.

**What not to do:** don't describe the MP4 box tree (moov, mdat, ftyp) beyond "the header holds the
configuration, in a place called avc1". No fast start, no fragmented MP4, no CMAF or HLS. One clause,
"there are variants of MP4 made for streaming", at most. Don't explain the spec syntax, dynamic
pads or `:new_tracks`; those are episodes 04 and 12. Don't call the produced MP4 "stereo": with this
asset the AAC comes out mono.
