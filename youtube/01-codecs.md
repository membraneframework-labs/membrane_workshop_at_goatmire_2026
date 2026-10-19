# 01 · Why raw video doesn't fit anywhere: codecs

| | |
|---|---|
| Type | CONCEPT |
| Length | 5-6 min |
| SEO title | "What is a video codec? H.264, VP8, AAC and MP3 explained (Multimedia 101 #1)" |
| Keywords | what is a codec, codec vs container, encoder decoder, transcoding, h264 vs vp8, aac vs mp3 |
| Source | Ch. 1 slides "Codecs", "Encoding, decoding, transcoding" |
| On screen | The 1920×1080×3×30 arithmetic built up on screen while you say it. The transcoding diagram (mermaid from the slide). One complete `Membrane.Transcoder` example at the end, transcoder lines highlighted. |

## Facts that must land

- 1920 × 1080 × 3 bytes × 30 fps ≈ 187 MB/s. A two-hour movie ≈ 1.3 TB.
- Codec = two programs. The encoder compresses raw media, the decoder turns it back into frames or audio.
- Lossy compression throws away what you can't see or hear, and what was already in the previous frame.
- Video: H.264/AVC (the most widespread), VP8 (open, royalty-free, WebRTC). Audio: MP3 (the classic), AAC (its successor).
- Transcoding = decode → raw → encode. In the middle you hold raw media: that's where you can look at it, change it, or play it.
- In Membrane, codecs are elements shipped in plugins; `Membrane.Transcoder` picks the decoder and encoder for you, you declare the output format. Its default H.264 output is a plain Annex B stream, so it can go straight into a file.

---

## Version A (detailed)

**[0:00] Cold open. On camera, the arithmetic builds up on screen as you say it.**

> Let's do some quick math. A full HD frame is nineteen-twenty by ten-eighty pixels, so about
> two million pixels. Each pixel needs three bytes, for red, green and blue. That's about six
> megabytes for a single frame. At thirty frames a second, you're at a hundred and eighty-seven
> megabytes every second.

> A two-hour movie would be one point three terabytes. Nothing handles that comfortably: not your
> disk, not your network, not your memory. So something has to shrink it, and that something is a codec.

**[0:25] Bumper**

**[0:30] On camera**

> In this video I'll explain what a codec actually does, why there are so many of them, and what
> people mean when they say "transcoding". At the end I'll show you how all of this looks in Membrane.

**[0:45] The concept: codec. Diagram: raw → [encoder] → coded stream → [decoder] → raw**

> A codec is really two programs. One is the encoder: you give it raw video, it compresses it.
> The other is the decoder: you give it the compressed stream, it gives you back frames you can
> show, or audio you can play.

> And the compression is huge. Those 187 megabytes per second turn into something like half a
> megabyte per second for a stream that still looks fine. That's over three hundred times smaller.

**[1:15] How is that possible? Three kinds of redundancy, one graphic each.**

> So how do you throw away ninety-nine percent of the data and still get a picture? There are
> basically three tricks.

> The first one is that pixels next to each other usually look alike. If there's a blue sky,
> it's mostly the same blue, so you don't need to store every pixel separately.
> The second one is that frames next to each other look alike too. If I'm just talking to the
> camera, thirty frames of that are thirty nearly identical pictures, so you store the first one
> and then only what moved. Remember this one, it has consequences for timestamps, and I'll get
> to that in another episode.
> The third trick is that your eyes and ears aren't perfect. You can't tell apart two shades of
> green that differ by one bit, and you can't hear a quiet sound right after a loud one, so the
> encoder just doesn't keep them.

> That third trick is what makes the codec lossy. What comes out of the decoder isn't exactly
> what went in. It's just close enough that you don't notice.

**[2:00] Names. The 2×2 table from the slide.**

> You've probably seen the names. For video there's H.264, also called AVC. It's by far the most
> widely supported video format out there, every device you own can decode it. Then there's VP8,
> which is open and royalty-free, and that's what you'll meet in WebRTC, so in video calls.
> There are newer ones too, H.265, VP9, AV1. They compress better and cost more CPU, but the idea
> is the same.

> For audio there's MP3, the classic one, and AAC, which was designed as its successor and is
> what you usually find inside an MP4 file.

> One thing to keep in mind: none of these are files. H.264 is a format for a stream of bytes.
> How that stream ends up in a file is a separate question, and that's the next episode.

**[2:45] Transcoding. Diagram from the slide: VP8 → decoder → raw → H.264 encoder.**

> Now, say you have VP8 and you need H.264. You can't convert one directly into the other.
> What you do is decode the VP8 into raw frames, and then encode those raw frames into H.264.
> That's called transcoding, and it works the same way for audio: MP3 goes through a decoder,
> you get raw samples, and those go into an AAC encoder.

> And this is the one thing I'd like you to remember from this episode.

**[3:05] On screen, large: "In the middle, you hold raw media."**

> In the middle, you hold raw media. That's the only place where you can actually look at the
> picture, change it, or play it. Encoded data is opaque, you can't do anything with it.
> So everything interesting you can do to video, like inverting colors, scaling, or switching
> between streams, happens on the raw frames between a decoder and an encoder.

**[3:25] In Membrane**

> So how does this look in Membrane? Membrane is a multimedia framework for Elixir. In Membrane,
> every codec is an element: a decoder is a component with H.264 going in and raw frames coming
> out, and an encoder is the same thing the other way around. They come in plugins, one package
> per codec, and most of them wrap native libraries like FFmpeg that have been around for years.

> But in practice you usually don't pick them by hand. There's a component called the Transcoder.
> Here's a complete pipeline that turns a VP8 file into H.264:

**[3:45] Code on screen. Highlight the two transcoder lines.**

```elixir
child(:source, %Membrane.File.Source{location: "input.ivf"})
|> child(:deserializer, Membrane.IVF.Deserializer)
|> child(:transcoder, Membrane.Transcoder)
|> via_out(:output,
  options: [output_stream_format: %Membrane.Transcoder.OutputFormat.H264{}]
)
|> child(:sink, %Membrane.File.Sink{location: "output.h264"})
```

> The first two lines read a file and unpack the video stream from it. The last line writes the
> result to a file. The part that matters is in the middle: one Transcoder, and the format you
> want to come out of it. Whatever comes in, whether that's VP8, raw frames, or even H.264 already,
> it figures out which decoder and encoder to put inside, and you get H.264. Don't worry about the
> syntax yet, there's an episode about how these pipelines are described. For now, the point is
> that you declare the output and the codec plumbing is done for you.

**[4:15] Takeaway + next**

> So, a codec is an encoder and a decoder, and the raw media in the middle is where you work.
> In the next episode we'll take that H.264 stream, which is still just bytes, and look at how
> you put it in a file together with the audio, so that a player knows where each frame starts.
> That's what containers are for. See you there.

**[4:35] End**

---

## Version B (room for you)

**Hook, pick one:**

1. The arithmetic on screen, numbers one at a time, silence between them. End on "Raw video doesn't fit anywhere."
2. Physical: `[YOU: hold up a USB stick / a phone]` "This holds about 128 gigs. That's eleven minutes of raw 1080p."
3. `[YOU: have you ever sent someone raw video? Or opened a .yuv file for the first time?]`

**Beats:**

1. The number: 187 MB/s, 1.3 TB for a movie. Must land.
2. Codec = encoder + decoder, two programs. Simple diagram. Skip the etymology.
3. How to throw away 99%: within a frame, between frames, in perception. `[YOU: favourite compression
   artifact? Banding on a dark gradient, blocks on confetti, "YouTube snow"?]`
4. Names: H.264/AVC, VP8, MP3, AAC. One sentence each. `[YOU: an opinion on AV1 / on patents /
   on why WebRTC likes VP8?]` Don't go deeper, that's a separate episode some day.
5. Transcoding: decode → raw → encode.
6. **The series sentence:** "In the middle, you hold raw media." Say it clearly, it will come back.
7. In Membrane: codecs = elements in plugins, `Membrane.Transcoder` = "say what you want out".
   One complete example, point only at the transcoder lines. Don't explain the syntax.
8. Next: containers.

**What not to do:** don't explain GOPs, I/P/B-frames, quantization or entropy coding.
The episode is 5 minutes. B-frames come back in the timestamps episode, there's room for them there.
