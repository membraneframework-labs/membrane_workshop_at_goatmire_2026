# 02 · MP4 is not a video format: containers, muxing and demuxing

| | |
|---|---|
| Type | CONCEPT |
| Length | 5-6 min |
| SEO title | "MP4 vs H.264: what is a container? Muxing and demuxing explained (Multimedia 101 #2)" |
| Keywords | mp4 vs h264, what is a container format, muxing, demuxing, mkv vs mp4, codec vs container |
| Source | Ch. 1 slides "Containers", "Muxing and demuxing", the pipeline diagram from "Task 1" and the `chapter-1-checkpoint` pipeline (used as a finished example), Ch. 1 BONUS hints (demuxer) |
| On screen | `ffprobe` on `assets/bbb_h264_aac.mp4` (480×270 H.264 + stereo AAC, 33 s). Mux/demux diagrams from the slides. Diagram, then the complete code, of the example pipeline (MP3 + VP8-in-IVF → MP4), three container-related lines highlighted. |

## Facts that must land

- MP4 is not a codec. "MP4" says how the streams are packaged, not how they're compressed.
- An encoded stream is just bytes. A container adds: where a frame starts, what its timestamp is, which track it belongs to.
- MP4: many tracks (video, audio, subtitles), everywhere. IVF: trivial, one VP8/VP9/AV1 track. MP3 doesn't need one.
- Muxing = interleaving several streams into one, synchronized. Demuxing = the reverse, every player does it.
- Containers often carry codec configuration too (that's where `stream_structure: :avc1` and `config: :esds` come from).
- In Membrane: `Membrane.IVF.Deserializer`, `Membrane.MP4.Muxer.ISOM`, `Membrane.MP4.Demuxer.ISOM`. For MP3 without a container, the source has to be told what it's reading (`content_format`).

---

## Version A (detailed)

**[0:00] Cold open. Terminal, `ffprobe assets/bbb_h264_aac.mp4`, the two Stream lines highlighted.**

> This is an MP4 file, and this is what ffprobe says about it. Stream zero is video, encoded with
> h264. Stream one is audio, encoded with aac. There's no "MP4 compression" anywhere in here.
> MP4 is not a video format, and in this episode I'll explain what it actually is.

**[0:15] Bumper**

**[0:20] On camera**

> A codec gives you a compressed stream of bytes. This episode is about what you do with that
> stream: containers, muxing and demuxing. And at the end I'll show you the Membrane elements
> for each of them.

**[0:35] The concept: container. Graphic: a long strip of bytes with no marks, then the same strip with frames and labels.**

> An encoded stream is just bytes. If I give you a file with a raw H.264 stream, you run into a
> few problems. Where does one frame end and the next one begin? When should each frame be shown?
> And if I also give you the audio, how do you know which second of audio goes with which frame?

> A container answers those questions. It wraps the streams with what a reader needs: frame
> boundaries, timestamps, and which track each chunk belongs to. Tracks are just the streams
> inside: a video track, an audio track, maybe subtitles, maybe a second audio language.

**[1:15] Examples. Three file icons.**

> MP4 is the container you meet everywhere. It can hold many tracks, you can jump to any point,
> and it plays on every device. The spec is called ISO Base Media File Format, which is why
> you'll see "ISOM" in library names.

> IVF is on the opposite end. It's a tiny container for a single video stream, VP8, VP9 or AV1.
> There's a short header, and then frames, each with its size and a timestamp in front of it.
> It's simple enough to read in a hex editor, which makes it a good example when you're learning.

> And MP3 doesn't need a container at all. Every MP3 frame starts with a header that says what
> it is, so the encoded stream can go straight into a file. That's why ".mp3" is both the codec
> and the file, and it's the exception that confuses everyone.

**[1:55] Codec vs container. The two pills from the slide.**

> So these are two separate questions. The codec is how the media is compressed. The container
> is how the streams are packaged. You can have H.264 in MP4, H.264 in MKV, VP8 in IVF, VP8 in
> WebM, any combination the container allows. So when somebody asks you to "convert this to MP4",
> you have to ask which part they mean.

**[2:15] Muxing / demuxing. Diagrams from the slide.**

> Putting streams into a container is called muxing, short for multiplexing. The muxer takes an
> H.264 stream and an AAC stream and interleaves them: a bit of video, the matching bit of audio,
> a bit of video again, and so on, with timestamps, so a player can read the file from the
> beginning and keep both in sync.

> Demuxing is the reverse, and it's the first thing every media player does: open the file,
> split it back into separate streams, and hand each one to its decoder.

**[2:45] A detail that connects to the example: codec configuration inside the container.**

> There's one more thing containers do, and it will bite you the first time you meet it. Some
> codecs need configuration before the decoder can start. For H.264 those are the parameter
> sets, which describe the resolution and the encoding options. They can either travel inside
> the stream, or the container can store them once, in its header. MP4 does the latter. So the
> same H.264 comes in two shapes, and a muxer will insist on one of them. Keep that in mind,
> because it shows up in the example.

**[3:10] In Membrane**

> In Membrane, each of these is an element. `Membrane.IVF.Deserializer` takes an IVF stream in
> and gives you the VP8 stream out. `Membrane.MP4.Muxer.ISOM` takes any number of encoded
> streams and produces an MP4. And there's a demuxer too, `Membrane.MP4.Demuxer.ISOM`, which
> tells you what tracks it found and gives you one output per track.

**[3:30] Diagram of the example pipeline: MP3 + VP8-in-IVF → MP4. Then the code, three lines highlighted.**

> Here's a complete pipeline that uses all of this. MP3 goes in, VP8 in an IVF file goes in, and
> out comes an MP4 with AAC and H.264. Seven boxes: two file sources, the IVF deserializer, two
> transcoders, the MP4 muxer, and a file sink. And this is the same thing as code. Every box is
> one line that starts with `child`.

```elixir
spec = [
  child(:ivf_file_source, %Membrane.File.Source{location: "bbb_vp8.ivf"})
  |> child(:ivf_deserializer, Membrane.IVF.Deserializer)
  |> child(:video_transcoder, Membrane.Transcoder)
  |> via_out(:output,
    options: [output_stream_format: %Membrane.Transcoder.OutputFormat.H264{stream_structure: :avc1}]
  )
  |> child(:mp4_muxer, Membrane.MP4.Muxer.ISOM)
  |> child(:mp4_file_sink, %Membrane.File.Sink{location: "result.mp4"}),

  child(:mp3_file_source, %Membrane.File.Source{
    location: "bbb.mp3",
    content_format: Membrane.MPEGAudio
  })
  |> child(:audio_transcoder, Membrane.Transcoder)
  |> via_out(:output,
    options: [output_stream_format: %Membrane.Transcoder.OutputFormat.AAC{config: :esds}]
  )
  |> get_child(:mp4_muxer)
]
```

> You don't have to read all of it. Three lines are about containers, and those are the ones I
> want you to see.

> The first one is the MP3 source. The MP3 file has no container, so nothing tells the next
> element what's inside. You have to tell the file source yourself, and that's the content format
> option: MPEG audio.

> The other two are the output formats of the transcoders. The muxer wants H.264 with the
> parameter sets out of band, and AAC with its config in the MP4 header. In each transcoder
> that's a single option: stream structure avc1 for the video, config esds for the audio.

> Those names, avc1 and esds, are the names of the boxes inside the MP4 file where that config
> lives. If you scroll back to the ffprobe output from the beginning, right next to "h264" it
> says avc1. Same thing. The container reaches into the codec settings, and that's completely normal.

**[4:20] Takeaway + next**

> So, the codec is how it's compressed, the container is how it's packaged, and a muxer puts
> streams in while a demuxer takes them out. In the next episode we take those seven boxes with
> arrows between them and look at how you describe that as a program. Media processing is a
> graph, and that's exactly what a Membrane pipeline is.

**[4:40] End**

---

## Version B (room for you)

**Hook, pick one:**

1. `ffprobe` live: "There's no MP4 compression in here."
2. Rename a file: `mv movie.mp4 movie.mkv`, it doesn't work or it does; `[YOU: what happens
   and why]`. Risky, but effective if you've got it down.
3. `[YOU: the question you hear most often from people outside multimedia. "Convert to MP4"?
   "Why won't my MP4 play on X?"]`

**Beats:**

1. An encoded stream is just bytes: you don't know where a frame is, when to show it, whose it is.
2. Container = boundaries + timestamps + tracks.
3. MP4 (everywhere, ISOM), IVF (trivial, readable in a hex editor), MP3 (doesn't need one, the exception).
   `[YOU: other containers you like or can't stand? MPEG-TS? MKV? Why?]`
4. Codec vs container, two questions. "Which part?"
5. Mux = interleaving with sync. Demux = the first thing a player does.
6. The container carries codec config (avc1 / esds). This sets up the example.
7. In Membrane: three elements (IVF.Deserializer, MP4.Muxer.ISOM, MP4.Demuxer.ISOM) + the example
   pipeline, diagram then complete code, point only at the three container lines
   (content_format, stream_structure, config). Call back to avc1 in the ffprobe output.
8. Next: the pipeline as a graph.

**What not to do:** don't describe the MP4 box structure (moov, mdat, ftyp). Don't go into
fragmented MP4 / CMAF / HLS. One sentence, "there are variants for streaming", is enough.
