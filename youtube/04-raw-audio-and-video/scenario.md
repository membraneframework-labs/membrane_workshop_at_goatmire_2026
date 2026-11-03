# 04 · What raw audio and video look like in memory

| | |
|---|---|
| Type | CONCEPT |
| Length | 7-8 min |
| SEO title | "Raw video and raw audio explained: frames, pixel formats, samples and PCM (Multimedia 101 #4)" |
| Keywords | raw video format, what is a video frame, yuv420 vs rgb, i420 pixel format, pcm audio explained, sample rate and bit depth, raw audio samples |
| Source | Ch. 2 slides "Raw video and RGB"; DEEP_DIVE Ch. 2 "RGB", "Resolution", "Pixel format"; DEEP_DIVE Ch. 3 "Timestamps" (raw audio has a fixed sample size); `deps/membrane_raw_video_format`, `deps/membrane_raw_audio_format`, the Transcoder's raw output formats; `notes/facts.md` for every verified detail and number |
| On screen | Overlays from `images/` (see `images/README.md` for the file ↔ timestamp map): a hex dump of a raw frame, a strip of pixels folded into rows in three steps, the two by two RGB frame, the three planes of I420, a wave with its samples, interleaved stereo samples, the sentence card, the two stream format cards, the pipeline with two branches, a terminal with the file sizes and the ffplay commands, the takeaway. Code comes from the Keynote presentation. |

---

## Version A (detailed)

**[0:00] Cold open. On camera. Overlay `01-hexdump.png`: a hex dump taken from the middle of the
raw video file (frame 100, through the title text), a block of varied bytes with no structure to
colour.**

> This is a video frame, not a JPEG or a PNG but the frame itself, the way a decoder hands it over.
> A decoder is the program that turns compressed video back into pictures, and what it gives you is
> a couple of hundred thousand bytes like these. If I give you only this, you can't draw it, because
> nothing in here says how wide the picture is or what the bytes mean. [stiff, the whole paragraph.
> rephrase it or drop it at all]

**[0:35] Bumper**

**[0:40] On camera**

> In this video I'll explain what raw video and audio are and what they look like in memory. I will
> go over topics like resolution, pixel formats, sample rate and channels. At the end I'll show you
> how to get at that raw data in Membrane, an open-source multimedia framework for Elixir.

**[1:00] Overlays `02-rows-1.png` to `02-rows-3.png`: twenty-four plain squares, each one pixel
numbered by its position in memory, 0 to 23: as one long strip (on "one flat block of bytes"),
then folded into rows of six (on "the width tells you"), then pixel 15 found by skipping two full
rows and moving three along the third, the rest dimmed (on "skip the rows above it").**

[?idk, maybe we could drop the last sentence of this paragraph and the graphics 3]
> Let's start with video. A raw video stream is a series of pictures called frames, and each frame
> is one flat block of bytes, the pixels one after another. They are laid out row by row from the
> top, left to right. So the first thing you need to know about a frame is its resolution, the width
> and height in pixels. The width tells you where one row ends and the next one begins. With that,
> you can find any pixel: skip the rows above it, then move along its row to its column.

**[1:35] Overlay `03-rgb.png`: the two by two frame of four colour swatches lettered A to D,
labelled "the picture", and under it the same frame labelled "the same frame in memory": the
twelve bytes in a dashed strip, in threes under the letter of their pixel, tinted red, green and
blue, with their positions 0 to 11 underneath, and the key red, green, blue.**

> The second thing you need is the pixel format, which says how many bytes a pixel takes and what
> they mean. The best-known one is RGB: three bytes per pixel. One byte for red, one for green and
> one for blue. Each of them from zero to two hundred fifty-five. Here is a small, two by two frame.
> It is represented by twelve bytes, three per pixel.

**[2:05] Overlay `04-i420.png`: a six by four picture (sky, a sun, ground), and under it the same
frame in memory as I420: a dashed memory strip with three planes one after another, the brightness
plane in greys, then the two colour planes in the colours a video tool shows them, each with its
byte count (24, 6, 6), and "1.5 bytes per pixel on average" under it. Say "I four-twenty".**

> But that's not what a video decoder usually gives you. Decoders mostly hand you one of a family of
> formats called YUV. YUV uses the fact that your eye sees fine detail much better in brightness
> than in colour. So we can keep brightness for every single pixel, while keeping the same colour
> for a batch of them, like a square two by two. The most common YUV version is I420. It splits the
> frame into three parts called planes: first all the brightness bytes, then the two colour planes,
> each a quarter of the brightness plane. On average that's one and a half bytes per pixel instead
> of three, so half the memory for the same picture, before any compression is involved.

**[2:55] Overlay `05-samples.png`: a plain sine wave with dots at regular intervals, four of the
dots labelled with their values (a peak, a point on the slope, a trough, one more), no caption.**

> Now let's explain the raw audio. Sound is a wave, and raw audio is that wave measured at regular
> intervals. Each measurement is called a sample, and it's just a number: how far the wave is from
> the middle at that moment. How often you measure is the sample rate, typically forty-four thousand
> one hundred times a second.

**[3:15] Overlay `06-interleaved.png`: a row of samples labelled L, R, L, R, two bytes each, with
real bytes from the audio file.**

> Then you need the sample format: how big each number is and how to read it. Most of the time
> that's sixteen-bit integers. It means two bytes per sample.

> Another thing you need to read raw audio, is the number of channels. Stereo has two, left and
> right, and in memory they are usually interleaved: one sample for the left, one for the right, and
> so on. So one second of stereo with two channels takes 2 times more space, than one second of
> mono audio. With 2 bytes per sample and a standard sampling rate, it takes almost 2 megabytes.
> That is far less than video, but still about ten times what one second of MP3 takes.

**[4:05] Overlay `07-sentence.png`, large: "Raw data doesn't describe itself."**

> And this is what video and audio have in common. Raw data doesn't describe itself. A raw frame has
> no embedded metadata, and neither does a block of samples. The bytes don't say how wide the picture is,
> whether it's RGB or I420, or how many channels the audio has. You need these information
> if you want to understand or process it in any way. In case of raw media, all of that has to travel 
> next to bytes representing pixels or samples.

**[4:35] Overlay `08-stream-format.png`: two cards, "Raw video: width, height, pixel format" and
"Raw audio: sample rate, sample format, channels".**

> So how does this look in Membrane?  In Membrane, you describe media processing as a graph of
> elements, called a pipeline, where each element does one thing with the stream and passes it on.
> (BTW, if you still don't know what Membrane is, check out this: ___)
> Before any data goes from one element to the next, the element sends a thing we call a stream format.
> Stream format describes the stream, that will be sent or received via a Membrane Pad. 
> For raw video, it contains the width, the height and the pixel format. For
> raw audio, ir provides the sample rate, the sample format and the number of channels. Then the data follows,
> so element that receives the stream knows how to read it.

**[5:25] Overlay `09-pipeline.png`: the pipeline, data flowing top to bottom, the video branch on
the left (file source, IVF deserializer, Transcoder, file sink), the audio branch on the right
(file source, Transcoder, file sink).**

> Many times you will not see the raw data at all, because the Transcoder, a component that converts
> media from one compressed format to another, decodes and encodes the stream inside itself. But you can ask it
> for raw output instead. Here is a pipeline that decodes a video compressed with VP8 and an MP3
> file, and writes the raw bytes of both to files.

**[5:55] Keynote presentation: the spec, built up line by line as you speak. The first sentence is
spoken over the empty slide; from the second sentence on, each sentence corresponds to the lines
that appear at that moment.**

```elixir
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
```

> Don't worry about the syntax, that's a topic for another episode. The first element reads the
> video file. The video sits in a simple container called IVF, a file format that wraps the stream,
> so the IVF deserializer unpacks the plain VP8 stream from it. Then comes the Transcoder, and
> instead of a compressed format we ask it for raw video in I420, which is what the decoder inside
> it produces anyway. And a file sink writes whatever comes out to disk, so this file is nothing but
> frames, one after another.

> The second branch reads the MP3, and tells the source what's inside, because MP3 has no container
> to say so. Then a Transcoder again, asked for raw audio. Here we spell out every field,
> sixteen-bit samples, forty-four thousand one hundred per second, two channels, so the file comes
> out exactly in the format we asked for. And a file sink writes the samples to a second file.

**[6:55] Overlay `10-terminal.png`: a terminal panel with the byte counts of the four files
(`wc -c`, so the spoken "hundred and fifty-eight megabytes" and "almost six megabytes" match what
is shown), then the two ffplay commands, the format flags highlighted.**

> When this pipeline is done, the video file is a hundred and fifty-eight megabytes for half a
> minute of video. The VP8 file we started with is one megabyte, and the audio comes to almost six
> megabytes against half a megabyte of MP3. And to play the video file with a player like ffplay, we
> have to tell it everything the file doesn't say. That it's raw video, the pixel format, which
> ffplay calls yuv420p, the resolution, and the frame rate, and then it plays. The same for the
> audio: the sample format, the rate and the channels. Membrane itself takes the frame rate from
> timestamps, a topic for another episode.

**[7:40] Overlay `11-takeaway.png`.**

> So, a raw frame is a flat block of pixels, read with a resolution and a pixel format. Raw audio is
> a run of samples, read with a sample rate, a sample format and the number of channels. Raw data
> doesn't describe itself. The description travels alongside it, and in Membrane that's the stream
> format.

> Thank you for watching, and see you in the next episode.

**[8:10] End**

---

## Version B (room for you)

**Hook, pick one:**

1. The hex dump of a frame: "you can't draw this, because nothing in here says how".
2. `[YOU: the first time you opened a .yuv or .raw file in a hex editor, or in an image viewer
   with the wrong width, and what it looked like]`
3. `wc -c` on the raw video file next to the VP8 file it came from: a hundred and fifty-eight
   megabytes against one.

**Beats:**

1. Raw video: frames, each a flat block of bytes, rows top to bottom, left to right. Resolution
   tells you where the rows wrap and how to find a pixel.
2. Pixel format: RGB, three bytes per pixel, the two by two example. The format for touching
   pixels by hand.
3. YUV and I420: brightness for every pixel, colour per two by two block, three planes, one and a
   half bytes per pixel on average; what decoders give you.
   `[YOU: an I420 war story, a green or purple picture from a wrong stride or a swapped plane]`
4. Raw audio: samples, sample rate (44.1 and 48 thousand), sample format (16-bit integers most of
   the time), channels usually interleaved L R L R. One second of 16-bit stereo at 44.1 kHz: about
   176 kilobytes, about ten times a typical MP3.
5. **The sentence:** raw data doesn't describe itself. No header anywhere; the description has to
   travel next to the bytes.
6. In Membrane: two-sentence intro of Membrane, the stream format as that description, the two
   cards.
7. The pipeline: the Transcoder asked for raw output instead of a compressed format; code from
   Keynote top to bottom, every field of the raw audio format spelled out and why.
8. On camera: the sizes in bytes, and ffplay needing the format flags because the file has none.
   `[YOU: run it live if you like; the first frames are a flat light grey, the title card comes at
four seconds]`
9. Takeaway, then a plain goodbye. No promise about the next topic.

**What not to do:** no colour science (no colour spaces, no chroma siting, no limited range, no
HDR), no other pixel formats than RGB and I420, no stride or alignment, no colour inversion or any
custom element (that is a later episode), no timestamps beyond the one clause about the frame
rate, no claim that the stream format carries the frame rate (in this run it doesn't), no "audio
frame" (say sample), don't call I420 compression, don't call RGB what the decoder gives you, don't
read sizes off `ls -lh` (it prints 151M for the same file).