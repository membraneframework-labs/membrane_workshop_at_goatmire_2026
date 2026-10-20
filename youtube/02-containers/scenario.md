# 02 · MP4 is not a codec: containers, muxing and demuxing

| | |
|---|---|
| Type | CONCEPT |
| Length | 7-8 min |
| SEO title | "MP4 vs H.264: what is a container? Muxing and demuxing explained (Multimedia 101 #2)" |
| Keywords | mp4 vs h264, what is a container format, muxing, demuxing, mkv vs mp4, codec vs container, what is muxing |
| Source | Ch. 1 slides "Containers", "Muxing and demuxing", the "Task 1" pipeline diagram and the elements table; DEEP_DIVE Ch. 1 "The process" and the Transcoder hints; the finished Ch. 1 pipeline; `notes/facts.md` for every verified detail |
| On screen | Overlays from `images/` (see `images/README.md` for the file ↔ timestamp map): the two ffprobe stream lines (twice, with different highlights), a strip of bytes that gains boundaries, timestamps and tracks in three steps, the codec/container cards, three files drawn with what is inside them (built up in three steps), the IVF header decoded, the mux and demux diagrams, the two shapes of H.264, the pipeline diagram with its two container elements highlighted in turn, the takeaway. Code comes from the Keynote presentation. |

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

> Here is what a tool called ffprobe says about an MP4 file. Stream zero is video, encoded with
> H.264. Stream one is audio, encoded with AAC. There is no "MP4 compression" anywhere in here. So
> if MP4 doesn't compress anything, what does it actually do? That's what this episode is about.

**[0:20] Bumper**

**[0:25] On camera**

> In this video I'll explain what a multimedia container is, why MP4 is not a codec, and what muxing
> and demuxing mean. At the end I'll show you how all of this looks in Membrane, an open-source
> multimedia framework for Elixir.

**[0:40] Overlay `02-bytes-1.png`: a long strip of identical bytes with no marks. The questions in the first paragraph play over it. Then `02-bytes-2.png`, `-3.png`, `-4.png` as the frame boundaries, the timestamps and the track colours appear, one per clause of "where each frame starts, what its timestamp is, and which track it belongs to" in the second paragraph.**

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
> asking which part they mean: repackaging is quick, re-encoding is not.

**[1:55] Overlays `04-inside-the-file-1.png`, `-2.png`, `-3.png`: three files appear one by one as you reach them. movie.mp4 is drawn as an MP4 container holding an H.264 track and an AAC track; video.ivf as an IVF container holding one VP8 track; song.mp3 as a bare MP3 stream with a dashed "no container" frame around it. While on IVF, switch to `05-ivf-header.png` (the first 48 bytes of an IVF file, with the signature, codec, width, height, frame rate, frame count and the first frame header coloured and labelled), then back to `04-inside-the-file-3.png` as the MP3 sentence starts.**

> Let's look at three examples. MP4 is the container you meet everywhere. It can hold many tracks,
> you can jump to any point in the file, and almost every device can play it. It's an ISO standard,
> which is why you'll see "ISOM" in library names.

> IVF is the opposite: it's about as simple as a container gets. It holds a single video stream,
> VP8, VP9 or AV1. The file starts with a 32-byte header, and then every frame gets 12 bytes in
> front of it: the size of the frame and a timestamp. Here are the first bytes of such a file. First
> the signature and the codec name, then the picture size, 480 by 270, and 25 frames per second.
> Then the number of frames, 812. And then the 12-byte header of the first frame, which says that
> frame is 281 bytes long. The whole container adds less than one percent to the file.

> And MP3 doesn't need a container at all. Every MP3 frame starts with its own small header that
> says what kind of frame it is, and from that you know how long it is. So the encoded stream can go
> straight into a file. That's why MP3 is the name of both the codec and the file format.

**[3:20] Overlay `06-mux.png` (or `06-mux-vertical.png`, same content, if it should match the vertical pipeline later): H.264 and AAC streams going into an "MP4 muxer" box, MP4 coming out. Then `07-interleaved.png`: the output drawn as alternating chunks, video, audio, video, audio.**

> Putting streams into a container is called muxing. The muxer takes the H.264 stream and the AAC
> stream and interleaves them, so you get a chunk of video, then the matching chunk of audio, then
> the next chunk of video, and so on. Each piece gets its timestamp, so a player can read the file
> from the beginning and keep both in sync. The muxer doesn't compress anything. In the MP4 file
> from the beginning, the container is about half a percent of the size. The rest is the encoded
> media itself.

**[3:55] Overlay `08-demux.png` (or `08-demux-vertical.png`): MP4 going into an "MP4 demuxer" box, H.264 and AAC coming out, each arrow ending at a small decoder box.**

> Demuxing is the reverse, and it's the first thing a media player does with a file like this. It
> reads the part of the file that says where every frame is, splits the file back into the separate
> streams, and hands each one to its decoder. After the demuxer you still have H.264 and AAC, not
> pictures and sound.

**[4:20] Overlay `09-two-shapes.png`: the same H.264 drawn twice, once with the parameter sets repeated in front of the frames, once with them stored once in the MP4 header, labelled "avc1".**

> There's one more thing containers do, and you'll run into it the first time you try to put H.264
> into an MP4 yourself. Some codecs need a few settings before the decoder can start. For H.264
> those are the parameter sets, which describe the resolution and the encoding options. They can
> travel inside the stream, in front of the frames, or sit once in the container header, which is
> what MP4 normally does. So the same H.264 comes in two shapes, and a muxer insists on the shape it
> was designed for.

**[4:55] Overlay `01-ffprobe-entries.png`: the ffprobe lines again, this time with "avc1" and "mp4a" highlighted.**

> Here is the ffprobe output from the beginning again. Next to "h264" it says "avc1". That's the
> name of the box in the MP4 header where this configuration lives. The audio line has "mp4a" in the
> same spot, and inside that box the AAC configuration sits in another one called "esds".

**[5:15] Overlay `10-pipeline-1.png`: the pipeline diagram, data flowing top to bottom, video branch on the left, audio branch on the right, both merging into the muxer; every element a box.**

> So how does this look in Membrane? In Membrane, you build a media application as a pipeline: a
> chain of elements, where each element does one thing with the stream and passes it on. Here is a
> pipeline that takes a VP8 video in an IVF file and an MP3 file, and produces one MP4 with H.264
> and AAC inside. Every box does one job, and two of them are about containers: the IVF deserializer
> and the MP4 muxer.

**[5:45] Overlays `10-pipeline-2.png` and `-3.png`: the IVF deserializer, then the MP4 muxer highlighted, one per sentence.**

> The IVF deserializer unpacks the VP8 stream from the IVF file, so it's a demuxer for a one-track
> container. The MP4 muxer puts the AAC and the H.264 together into one MP4.

**[6:00] Keynote presentation: the spec, built up line by line as you speak. The first two sentences are spoken over the empty slide; from the third sentence on, each sentence corresponds to the lines that appear at that moment, and the full spec is visible only at the end.**

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

> Now let's look at how this pipeline is written. Don't worry about the syntax itself, that's a
> topic for another episode. The first element reads the IVF file. The second one, the IVF
> deserializer, takes the container apart and gives us the plain VP8 stream. Then a Transcoder, a
> component that re-encodes the stream, turns VP8 into H.264. Notice the option: stream structure
> avc1. That's the shape the MP4 muxer wants, with the parameter sets kept aside for the header.
> Then comes the MP4 muxer, with that ISOM in its name, and a file sink that writes the result to
> disk.

> The second branch starts with the MP3 file, and this is the no-container case in practice. There's
> no container header to announce the format, and the file source doesn't look inside the bytes, so
> we tell it ourselves: the content format is MPEG audio. Then a Transcoder turns MP3 into AAC, with
> config esds, again the shape the muxer wants. And the last line plugs this branch into the same
> muxer as the video.

**[7:10] Overlay `11-takeaway.png`.**

> So, the codec is how the media is compressed, and the container is how the streams are packaged. A
> muxer puts streams into a container, a demuxer takes them out, and neither of them touches the
> compression. In the next episode we'll look at what a Membrane pipeline is actually made of:
> elements, pads, and how they connect. See you there.

**[7:35] End**

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
8. In Membrane: two-sentence intro of Membrane, the pipeline diagram, the two container elements (the IVF deserializer, which is a demuxer, and the MP4 muxer), optionally one sentence that an MP4 demuxer exists. Then the code from Keynote, built line by line, with the MP3 source as the no-container case in practice and the three container options pointed out as they appear: `content_format`, `:avc1`, `:esds`.
9. Takeaway, then next: what a pipeline is made of.

**What not to do:** don't describe the MP4 box tree (moov, mdat, ftyp) beyond "the header holds the
configuration, in a place called avc1". No fast start, no fragmented MP4, no CMAF or HLS. One clause,
"there are variants of MP4 made for streaming", at most. Don't explain the spec syntax, dynamic
pads or `:new_tracks`; those are episodes 04 and 12. Don't call the produced MP4 "stereo": with this
asset the AAC comes out mono.
