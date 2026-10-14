# 02 · MP4 is not a video format: containers, muxing and demuxing

| | |
|---|---|
| Type | CONCEPT |
| Length | 4-5 min |
| SEO title | "MP4 vs H.264: what is a container? Muxing and demuxing explained (Multimedia 101 #2)" |
| Keywords | mp4 vs h264, what is a container format, muxing, demuxing, mkv vs mp4, codec vs container |
| Source | Ch. 1 slides "Containers", "Muxing and demuxing", the pipeline diagram from "Task 1" (used as an example pipeline), Ch. 1 BONUS hints (demuxer) |
| On screen | `ffprobe` on `assets/bbb_h264_aac.mp4`. Mux/demux diagrams from the slides. Diagram of an example transcoding-and-muxing pipeline (MP3 + VP8-in-IVF → MP4). |

## Facts that must land

- MP4 is not a codec. "MP4" says how the streams are packaged, not how they're compressed.
- An encoded stream is just bytes. A container adds: where a frame starts, what its timestamp is, which track it belongs to.
- MP4: many tracks (video, audio, subtitles), everywhere. IVF: trivial, one VP8/VP9/AV1 track. MP3 doesn't need a container.
- Muxing = interleaving several streams into one, synchronized. Demuxing = the reverse, every player does it.
- Containers often carry codec configuration too (that's where `stream_structure: :avc1` and `config: :esds` come from).
- In Membrane: `Membrane.IVF.Deserializer`, `Membrane.MP4.Muxer.ISOM`, `Membrane.MP4.Demuxer.ISOM`. For MP3 without a container, the source has to be told what it's reading (`content_format`).

---

## Version A (detailed)

**[0:00] Cold open. Terminal, `ffprobe assets/bbb_h264_aac.mp4`, two Stream lines highlighted.**

> This is "an MP4 file". Look closer. Stream zero: video, h264. Stream one: audio, aac.
> There is no "MP4 compression" anywhere in here. MP4 is not a video format.

**[0:15] Bumper**

**[0:20] On camera**

> Last episode: a codec turns raw media into a compressed stream. This episode: what you
> do with that stream. Containers, muxing, demuxing. And at the end, the Membrane elements
> for each of them.

**[0:35] The concept: container. Graphic: a long strip of bytes with no marks, then the same strip with frames and labels.**

> An encoded stream is just bytes. If I hand you a file with a raw H.264 stream, you have
> some problems. Where does one frame end and the next begin? When should each frame be shown?
> And if I also give you the audio, how do you know which second of audio goes with which frame?

> A container answers those. It wraps the streams with what a reader needs: frame boundaries,
> timestamps, and which track each chunk belongs to. Tracks are the streams inside:
> a video track, an audio track, maybe subtitles, maybe a second audio language.

**[1:15] Examples. Three file icons.**

> MP4 is the container you meet everywhere. Many tracks, random access, works on every device.
> The spec is called ISO Base Media File Format, which is why you'll see "ISOM" in library names.

> IVF is the opposite end: a tiny container for a single video stream, VP8, VP9 or AV1.
> A header, then frames with a size and a timestamp each. Simple enough to read with your eyes,
> which makes it a good example when you're learning.

> And MP3 doesn't need a container at all. Every MP3 frame starts with a header that says
> what it is, so the encoded stream can go straight into a file. That's why ".mp3" is both
> the codec and the file. It's the exception that confuses everyone.

**[1:55] Codec vs container. The two pills from the slide.**

> So, two separate questions. Codec: how is the media compressed. Container: how are the
> streams packaged. H.264 in MP4. H.264 in MKV. VP8 in IVF, VP8 in WebM. Any combination the
> container allows. When somebody says "convert this to MP4", you have to ask: which part?

**[2:15] Muxing / demuxing. Diagrams from the slide.**

> Putting streams into a container is muxing, short for multiplexing. The muxer takes an H.264
> stream and an AAC stream and interleaves them: a bit of video, the matching bit of audio,
> a bit of video, and so on, with timestamps, so a player can read the file front to back
> and keep them in sync.

> Demuxing is the reverse. It's the first thing every media player does: open the file,
> split it back into separate streams, and hand each to its decoder.

**[2:45] A detail that connects to the example: codec configuration inside the container.**

> One more thing containers do, and it will bite you the first time. Some codecs need
> configuration before the decoder can start: for H.264, the parameter sets that describe
> resolution and encoding options. They can travel inside the stream, or the container can
> store them once, in its header. MP4 does the latter. So the same H.264 has two "shapes",
> and a muxer insists on one of them. Keep that in mind for the example.

**[3:10] In Membrane**

> In Membrane, each of these is an element. `Membrane.IVF.Deserializer` takes an IVF stream in
> and gives you the VP8 stream out. `Membrane.MP4.Muxer.ISOM` takes any number of encoded streams
> and produces an MP4. There's a demuxer too, `Membrane.MP4.Demuxer.ISOM`, which tells you
> what tracks it found and gives you one output per track.

**[3:30] Diagram of the example pipeline: MP3 + VP8-in-IVF → MP4.**

> Here's a small example pipeline that uses all of this: MP3 in, VP8-in-IVF in, out comes an MP4
> with AAC and H.264. Every box is one element: a file source, the IVF deserializer,
> two transcoders, the MP4 muxer, a file sink.

> Two details, both about containers. The MP3 file has no container, so nothing tells the
> next element what's inside. You tell the file source yourself:

```elixir
%Membrane.File.Source{location: "audio.mp3", content_format: Membrane.MPEGAudio}
```

> And the muxer wants H.264 with the parameter sets out of band, and AAC with its config in
> the MP4 header. In the transcoder that's one option each:

```elixir
%Membrane.Transcoder.OutputFormat.H264{stream_structure: :avc1}
%Membrane.Transcoder.OutputFormat.AAC{config: :esds}
```

> Those names, avc1 and esds, are the names of the boxes in the MP4 file where that config lives.
> The container reaches into the codec settings. That's normal.

**[4:15] Takeaway + next**

> Codec: how it's compressed. Container: how it's packaged. Muxer in, demuxer out.
> Next episode: we've got six boxes and arrows between them. How do you describe that as a
> program? Media processing is a graph, and that's exactly what a Membrane pipeline is.

**[4:35] End**

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
3. MP4 (everywhere, ISOM), IVF (trivial, readable by eye), MP3 (doesn't need one, the exception).
   `[YOU: other containers you like or can't stand? MPEG-TS? MKV? Why?]`
4. Codec vs container, two questions. "Which part?"
5. Mux = interleaving with sync. Demux = the first thing a player does.
6. The container carries codec config (avc1 / esds). This sets up the example.
7. In Membrane: three elements (IVF.Deserializer, MP4.Muxer.ISOM, MP4.Demuxer.ISOM) + the example
   pipeline diagram + two snippets (content_format, stream_structure/config).
8. Next: the pipeline as a graph.

**What not to do:** don't describe the MP4 box structure (moov, mdat, ftyp). Don't go into
fragmented MP4 / CMAF / HLS. One sentence, "there are variants for streaming", is enough.
