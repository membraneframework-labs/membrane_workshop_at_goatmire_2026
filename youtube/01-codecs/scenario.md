# 01 · Why raw video doesn't fit anywhere: codecs

| | |
|---|---|
| Type | CONCEPT |
| Length | 6-7 min |
| SEO title | "What is a video codec? H.264, VP8, AAC and MP3 explained (Multimedia 101 #1)" |
| Keywords | what is a codec, codec vs container, encoder decoder, transcoding, h264 vs vp8, aac vs mp3 |
| Source | Ch. 1 slides "Codecs", "Encoding, decoding, transcoding" |
| On screen | The 1920×1080×3×30 arithmetic built up on screen while you say it. The compression ratio as numbers. The three-trick enumeration, with a blue sky photo and a frame with motion vectors (`ffplay -flags2 +export_mvs -vf codecview=mv=pf+bf+bb file.mp4`). The transcoding diagrams from the slide (video and audio). One complete `Membrane.Transcoder` example at the end (MP3 → AAC in MP4), transcoder lines highlighted, with the audio diagram next to the code. |

## Facts that must land

- 1920 × 1080 × 3 bytes × 30 fps ≈ 187 MB/s. A two-hour movie ≈ 1.3 TB.
- Codec = two programs. The encoder compresses raw media, the decoder turns it back into frames or audio.
- Lossy compression throws away what you can't see or hear, and what was already in the previous frame. Most codecs are lossy, not all.
- Video: H.264 (the most widespread), VP8 (open, royalty-free, WebRTC). Audio: MP3 (the classic), AAC (its successor), Opus (video calls).
- Transcoding = decode → raw → encode. In the middle you hold raw media: that's where you can look at it or change it.
- In Membrane, codecs are elements shipped in plugins; `Membrane.Transcoder` picks the decoder and encoder for you, you declare the output format.

---

## Version A (detailed)

**[0:00] Cold open. On camera, the arithmetic builds up on screen as you say it.**

> Let's do some quick math. A full HD frame is nineteen-twenty by ten-eighty pixels, so about
> two million pixels. Each pixel needs three bytes, for red, green and blue. That's about six
> megabytes for a single frame. At thirty frames a second, you're at ond hundred eighty-seven
> megabytes every second.

> A two-hour movie would be one point three terabytes. You can't store that, let alone stream it.
> So something has to shrink it, and that something is a codec.

**[0:25] Bumper**

**[0:30] On camera**

> In this video I'll explain what a codec actually does, why there are so many of them, and what
> people mean when they say "transcoding". At the end I'll show you how all of this looks in
> Membrane.

**[0:45] The concept: codec. Diagram: raw → [encoder] → coded stream → [decoder] → raw**

> A codec is really two programs. One is the encoder: you give it raw video, it compresses it.
> The other is the decoder: you give it the compressed stream, it gives you back frames you can
> show, or audio you can play.

**[1:00] Numbers on screen: 187 MB/s → ~0.5 MB/s**

> And the compression is huge. Those 187 megabytes per second turn into something like half a
> megabyte per second for a stream that still looks fine. That's almost four hundred times smaller.

**[1:15] How is that possible? An enumeration builds up on screen, one line per trick as you reach it:**
**1. Neighbour pixels are similar. 2. Neighbour frames are similar. 3. Human senses are not perfect.**
**Next to the first line: a photo of a blue sky. Next to the second: a video frame with the macroblock grid and motion vectors drawn over it (ffplay with the codecview filter), so the viewer sees the encoder tracking what moved.**

> So how do you throw away ninety-nine percent of the data and still get a picture? There are
> basically three tricks.

> The first one is that pixels next to each other usually look alike. If there's a blue sky,
> it's mostly the same blue, so you don't need to store every pixel separately.
> The second one is that frames next to each other look alike too. If I'm just talking to the
> camera, thirty frames of that are thirty nearly identical pictures, so you store the first one
> and then only where things moved. 
> The third trick is that your eyes and ears aren't perfect. You can't tell apart two shades of
> green that differ by one bit, and you can't hear a quiet sound right after a loud one, so the
> encoder just doesn't keep them.

> That third trick is what makes most codecs lossy. What comes out of the encoder usually isn't
> exactly what went in, but just close enough that you don't notice. 

**[2:00] Names. The codec table from the slide, with Opus added.**

> Let's go through a few names you'll run into. For video there's H.264. It's by far the most
> widely supported video format out there, almost every device you own can decode it. Then there's VP8,
> which is open and royalty-free, and that's what you'll meet in WebRTC, so in Google Meet or Teams calls.
> There are newer ones too, like H.265, VP9 or AV1. They compress better and are heavier on CPU or GPU,
> but the idea is the same.

> For audio there's MP3, the classic one, and AAC, which was designed as its successor and is
> what you usually find inside an MP4 file. And there's Opus, which is what live calls use
> for audio.

> One thing to keep in mind: a coding format is not a file format. H.264 describes a stream of
> bytes, and how that stream ends up in a file is a separate question. We will cover this topic in
> the next episode. MP3 is a bit special here, because you can just put it in the file, with to extra
> container needed.

**[2:45] Transcoding. Both diagrams from the slide: "VP8 stream → VP8 decoder → raw video frames → H.264 encoder → H.264 stream", and below it "MP3 stream → MP3 decoder → raw audio samples → AAC encoder → AAC stream". The decoder, raw media and encoder are grouped in a box labelled "transcoding".**

> Now, say you have VP8 and you need H.264. You can't convert one directly into the other.
> What you do is decode the VP8 into raw frames, and then encode those raw frames into H.264.
> That's called transcoding, and it works the same way for audio: MP3 goes through a decoder,
> you get raw samples, and those go into an AAC encoder.

> And there's something important about that middle step.

**[3:05] On screen, large: "In the middle, you hold raw media."**

> In the middle, you hold raw media. That's the only place where you can actually look at the
> picture or change it. Encoded data is opaque, you can't do much with it.
> So everything interesting you can do to video, like improving colors, or running
> AI inference, happens on the raw frames between a decoder and an encoder.

**[3:25] In Membrane**

> So how does this look in Membrane? 
> Well, first, let me tell you what Membrane is. Membrane is an open-source multimedia framework written
> in Elixir. In Membrane, you build a media application as a pipeline: a chain of elements, where
> each element does one thing with the stream and passes it on. A decoder is an element, an
> encoder is an element, and so is reading a file or writing one.

> You could wire a decoder and an encoder together yourself, but Membrane has a component for
> exactly the box labelled "transcoding" on the diagram we just saw. It's called the Transcoder. Here's a
> complete pipeline that takes an MP3 file and produces an MP4 file with AAC audio inside:

**[3:50] Code on screen. Highlight the two transcoder lines. Next to it, the audio transcoding diagram from the slide, with the "transcoding" box aligned with the highlighted lines.**

```elixir
child(:source, %Membrane.File.Source{
  location: "input.mp3", 
  content_format: Membrane.MPEGAudio
})
|> child(:transcoder, Membrane.Transcoder)
|> via_out(:output,
  options: [output_stream_format: %Membrane.Transcoder.OutputFormat.AAC{config: :esds}]
)
|> child(:muxer, Membrane.MP4.Muxer.ISOM)
|> child(:sink, %Membrane.File.Sink{location: "output.mp4"})
```

**Code slides for this walkthrough: `code-slides/` in this directory (VS Code Dark+ colouring, one slide per step: full snippet, source, transcoder, muxer and sink). Rendered PNGs in `code-slides/export/`.**

> Let's go through it top to bottom. First, we have to pull the audio stream into our pipeline.
> In this case, we read it from a file. Next, the Transcoder, and the only thing you tell it is what
> should come out: AAC. The Transcoder will recognize that the format of its input stream is MP3 so it 
> will know that it has to apply MP3 decoding on it.

> Then an MP4 muxer, which packs the AAC into an MP4 container, and a file
> sink, which writes it to disk. If you don't know what a container is yet, don't worry. We will explain it in the next episode.

> So where did the raw audio go? Inside the Transcoder. It looks at what comes in, MP3 here,
> and builds that transcoding box internally: an MP3 decoder, raw audio, an AAC encoder.
> You never see the raw step, and most of the time you don't need to. When you do, you split it
> into two Transcoders and put your own element in between.

**Code on screen, the same snippet with the Transcoder split in two and a custom element in between. Highlight the three middle lines.**

**[4:30] Takeaway + next**

> So, a codec is an encoder and a decoder, and the raw media in the middle is where you work.
> In the next episode we'll look at what actually happens in those last two lines: how encoded
> streams end up in a file together, so that a player knows where each frame starts and which
> audio goes with it. That's what containers are for. See you there.

**[4:50] End**

---

## Version B (room for you)

**Hook, pick one:**

1. The arithmetic on screen, numbers one at a time, silence between them. End on "Raw video doesn't fit anywhere."
2. Physical: `[YOU: hold up a USB stick / a phone]` "This holds about 128 gigs. That's eleven minutes of raw 1080p."
3. `[YOU: have you ever sent someone raw video? Or opened a .yuv file for the first time?]`

**Beats:**

1. The number: 187 MB/s, 1.3 TB for a movie. Must land.
2. Codec = encoder + decoder, two programs. Simple diagram. Skip the etymology.
3. How to throw away 99%: within a frame, between frames, in perception. Most codecs lossy, not all.
   `[YOU: favourite compression artifact? Banding on a dark gradient, blocks on confetti, "YouTube snow"?]`
4. Names: H.264, VP8, MP3, AAC, Opus. One sentence each, assume the viewer has never heard of them.
   `[YOU: an opinion on AV1 / on patents / on why WebRTC likes VP8?]` Don't go deeper, that's a separate episode some day.
5. Transcoding: decode → raw → encode.
6. **The series sentence:** "In the middle, you hold raw media." Say it clearly, it will come back.
7. In Membrane: two-sentence intro of Membrane (pipeline of elements, every box is an element).
   `Membrane.Transcoder` = the "transcoding" box from the diagram as one component, "say what you want out".
   One complete example (MP3 → AAC in MP4), point only at the transcoder lines, then answer
   "where did the raw audio go?" (inside; split into two Transcoders to get at it). Don't explain the syntax.
8. Next: containers.

**What not to do:** don't explain GOPs, I/P/B-frames, quantization or entropy coding.
The episode is 5 minutes. B-frames come back in the timestamps episode, there's room for them there.
