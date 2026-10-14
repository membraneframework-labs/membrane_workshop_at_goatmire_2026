# 01 · Why raw video doesn't fit anywhere: codecs

| | |
|---|---|
| Type | CONCEPT |
| Length | 4-5 min |
| SEO title | "What is a video codec? H.264, VP8, AAC and MP3 explained (Multimedia 101 #1)" |
| Keywords | what is a codec, codec vs container, encoder decoder, transcoding, h264 vs vp8, aac vs mp3 |
| Source | Ch. 1 slides "Codecs", "Encoding, decoding, transcoding" |
| On screen | The 1920×1080×3×30 arithmetic built up live. The transcoding diagram (mermaid from the slide). One `Membrane.Transcoder` snippet at the end. |

## Facts that must land

- 1920 × 1080 × 3 bytes × 30 fps ≈ 187 MB/s. A two-hour movie ≈ 1.3 TB.
- Codec = coder + decoder: a pair of algorithms. The encoder compresses raw media into a coding format, the decoder reverses it.
- Lossy compression throws away what you can't see or hear, and what was already in the previous frame.
- Video: H.264/AVC (the most widespread), VP8 (open, royalty-free, WebRTC). Audio: MP3 (the classic), AAC (its successor).
- Transcoding = decode → raw → encode. In the middle you hold raw media: that's where you can look at it, change it, or play it.
- In Membrane, codecs are elements shipped in plugins; `Membrane.Transcoder` picks the decoder and encoder for you, you declare the output format.

---

## Version A (detailed)

**[0:00] Cold open. Black screen, numbers appear one by one.**

> Full HD. Nineteen-twenty by ten-eighty pixels. That's about two million pixels.
> Three bytes per pixel, red, green, blue. Six megabytes per frame.
> Thirty frames a second.
> One hundred eighty-seven megabytes. Per second.

> A two-hour movie: one point three terabytes. Raw video doesn't fit anywhere.
> Not on a disc, not on a network, not in memory. Something has to shrink it.

**[0:25] Bumper**

**[0:30] On camera**

> That something is a codec. By the end of this video you'll know what a codec does,
> why there are so many of them, and what "transcoding" means.
> Then I'll show you how this looks in Membrane.

**[0:45] The concept: codec. Diagram: raw → [encoder] → coded stream → [decoder] → raw**

> The word is short for coder-decoder. A codec is a pair of algorithms.
> The encoder takes raw media and compresses it into a coding format.
> The decoder takes that format and turns it back into raw frames, or raw audio samples.

> The ratio is enormous. That 187 megabytes per second becomes something like
> half a megabyte per second for a decent-looking stream. Three hundred times smaller.

**[1:15] How is that possible? Three kinds of redundancy, one sentence each, simple graphic.**

> How do you throw away ninety-nine percent of the data and still see a picture?
> Three ways.

> One: within a frame, neighbouring pixels look alike. A blue sky is mostly the same blue.
> Two: between frames, almost nothing changes. Thirty frames of a talking head are
> thirty nearly identical pictures. So you store the first one, and then only what moved.
> We'll come back to this one, it has consequences for timestamps.
> Three: your eyes and ears are not perfect. You can't tell apart two shades of green
> that differ by one bit, and you can't hear a quiet sound right after a loud one.
> So the encoder doesn't bother keeping them.

> That last one makes the codec lossy. What comes out of the decoder is not what went in.
> It's close enough that you don't notice.

**[2:00] Names. The 2×2 table from the slide.**

> You've seen the names. For video: H.264, also called AVC. By far the most used video
> format in the world; if you watched anything today, it was probably H.264.
> And VP8: open, royalty-free, you'll find it in WebRTC, in video calls.
> There are newer ones, H.265, VP9, AV1, better compression, more CPU. Same idea.

> For audio: MP3, the classic. And AAC, designed as its successor, what you get in an MP4
> file or on a streaming service.

> None of these are files. H.264 is a format of a stream of bytes. How that stream ends up
> in a file is a separate question, and that's the next episode.

**[2:45] Transcoding. Diagram from the slide: VP8 → decoder → raw → H.264 encoder.**

> Now, what if you have VP8 and you need H.264? You can't convert directly. You decode
> VP8 into raw frames, then encode raw frames into H.264. That's transcoding.
> Same for audio: MP3 → decoder → raw samples → AAC encoder.

> And here's the thing I want you to remember from this episode:

**[3:05] On screen, large: "In the middle, you hold raw media."**

> In the middle, you hold raw media. That's the only place where you can look at the
> picture, change it, or play it. Encoded data is opaque. Everything interesting you can do
> to video, inverting colors, scaling, switching between streams, happens on the raw media
> between a decoder and an encoder.

**[3:25] In Membrane**

> So how does this look in Membrane? Membrane is a multimedia framework for Elixir.
> Every codec is an element: a decoder is a component that takes H.264 in and raw frames
> out, an encoder is the reverse. They're shipped in plugins, one package per codec,
> most of them wrapping battle-tested native libraries like FFmpeg.

> But you usually don't pick them by hand. There's an element called the Transcoder.
> You tell it what you want to come out:

**[3:45] Snippet, highlight lines.**

```elixir
child(:transcoder, Membrane.Transcoder)
|> via_out(:output,
  options: [output_stream_format: %Membrane.Transcoder.OutputFormat.H264{}]
)
```

> Whatever comes in, VP8, raw frames, H.264 already, it figures out which decoder and
> encoder to put inside and gives you H.264. Don't worry about the syntax yet,
> there's an episode on how these pipelines are described. For now: declare the output,
> the codec plumbing is done for you.

**[4:10] Takeaway + next**

> A codec is a pair of algorithms, encoder and decoder. Raw in the middle is where you work.
> Next episode: that H.264 stream is just bytes. How do you put it in a file, together with
> the audio, so that a player knows where each frame starts? Containers.
> Repo link below. See you there.

**[4:30] End**

---

## Version B (room for you)

**Hook, pick one:**

1. The arithmetic on screen, numbers one at a time, silence between them. End on "Raw video doesn't fit anywhere."
2. Physical: `[YOU: hold up a USB stick / a phone]` "This holds about 128 gigs. That's eleven minutes of raw 1080p."
3. `[YOU: have you ever sent someone raw video? Or opened a .yuv file for the first time?]`

**Beats:**

1. The number: 187 MB/s, 1.3 TB for a movie. Must land.
2. Codec = coder-decoder, two algorithms. Simple diagram.
3. How to throw away 99%: within a frame, between frames, in perception. `[YOU: favourite compression
   artifact? Banding on a dark gradient, blocks on confetti, "YouTube snow"?]`
4. Names: H.264/AVC, VP8, MP3, AAC. One sentence each. `[YOU: an opinion on AV1 / on patents /
   on why WebRTC likes VP8?]` Don't go deeper, that's a separate episode some day.
5. Transcoding: decode → raw → encode.
6. **The series sentence:** "In the middle, you hold raw media." Say it clearly, it will come back.
7. In Membrane: codecs = elements in plugins, `Membrane.Transcoder` = "say what you want out".
   One snippet. Don't explain the syntax.
8. Next: containers.

**What not to do:** don't explain GOPs, I/P/B-frames, quantization or entropy coding.
The episode is 5 minutes. B-frames come back in the timestamps episode, there's room for them there.
