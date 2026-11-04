# 04 · What raw audio and video look like in memory

| | |
|---|---|
| Type | CONCEPT |
| Length | 7-8 min |
| SEO title | "Raw video and raw audio explained: frames, pixel formats, samples and PCM (Multimedia 101 #4)" |
| Keywords | raw video format, what is a video frame, yuv420 vs rgb, i420 pixel format, pcm audio explained, sample rate and bit depth, raw audio samples |
| Source | Ch. 2 slides "Raw video and RGB"; DEEP_DIVE Ch. 2 "RGB", "Resolution", "Pixel format"; DEEP_DIVE Ch. 3 "Timestamps" (raw audio has a fixed sample size); `deps/membrane_raw_video_format`, `deps/membrane_raw_audio_format`, the Transcoder's raw output format, `deps/membrane_ffmpeg_swscale_plugin` (the scaler); `notes/facts.md` for every verified detail and number |
| On screen | Overlays from `images/` (see `images/README.md` for the file ↔ timestamp map): a hex dump of a raw frame, a strip of pixels folded into rows in three steps, the two by two RGB frame, the three planes of I420, a wave with its samples, interleaved stereo samples, the sentence card, the two stream format structs, the pipeline with the scaler, a terminal with ffprobe on the result, the takeaway. Code comes from the Keynote presentation. |

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
> so on. So one second of stereo with two channels takes 2 times more space, than one second of mono
> audio. With 2 bytes per sample and a standard sampling rate, it is almost 2 megabytes. That is
> far less than video, but still about ten times what one second of MP3 takes.

**[4:05] Overlay `07-sentence.png`, large: "Raw data doesn't describe itself."**

> And this is what video and audio have in common. Raw data doesn't describe itself. A raw frame has
> no embedded metadata, and neither does a block of samples. The bytes don't say how wide the
> picture is, whether it's RGB or I420, or how many channels the audio has. You need these
> information if you want to understand or process it in any way. And all of that
> has to travel alongside to bytes representing pixels or samples, outside of multimedia stream itself. 

**[4:35] Overlay `08-stream-format.png`: the two real stream format structs side by side as
formatted, syntax-coloured code: the `Membrane.RawVideo` struct with width 480, height 270,
framerate nil, pixel_format :I420, aligned true, and the `Membrane.RawAudio` struct with
sample_rate 44_100, sample_format :s16le, channels 2. On the "BTW" line, a YouTube card pointing
to episode 03.**

> So how does this look in Membrane?  In Membrane, you describe media processing as a graph of
> elements, called a pipeline, where each element does one thing with the stream and passes it on.
> (BTW, if you still don't know what Membrane is, check out this: <link to episode 03>)
> Before any data goes from one element to the next, the element sends a thing we call a stream format.
> Stream format describes the stream, that will be sent or received via a Membrane Pad.
> For raw video, it contains the width, the height and the pixel format. For
> raw audio, it provides the sample rate, the sample format and the number of channels. 
> Then the data follows,
> so the element that receives the stream knows how to read it.

**[5:30] Overlay `09-pipeline.png`: the pipeline, data flowing top to bottom, one chain: file
source, IVF deserializer, Transcoder (decode), scaler, Transcoder (encode), MP4 muxer, file sink,
with the input file above and the output file below drawn as dashed stream shapes.**

> In a Membrane pipeline you often don't see the raw data at all. The Transcoder, a Membrane
> component that converts media from one format to another, decodes and encodes streams inside
> itself, so the raw frames usually doesn't leave it. 
> But if you want to modify the stream in any way, there is a very big chance you will need to
> work on raw media.
> And Here is a pipeline that decodes a video compressed with VP8,
> and shrinks every frame to a third of its width and height. That could be useful when you run an AI model
> on the frames and want to save computing power, or when you send the stream over a poor network.
> We use the Transcoder twice here, once to decode and once to encode.

**[6:15] Keynote presentation: the spec, built up call by call as you speak. The first sentence is
spoken over the empty slide. Then each call that appears has its own sentence or sentences, in
this order: the file source, the deserializer, the decoder with its output options, the scaler,
the encoder with its output options, the muxer, the sink.**

```elixir
spec =
  child(:file_source, %Membrane.File.Source{location: "bbb_vp8.ivf"})
  |> child(:ivf_deserializer, Membrane.IVF.Deserializer)
  |> child(:decoder, Membrane.Transcoder)
  |> via_out(:output,
    options: [
      output_stream_format: %Membrane.Transcoder.OutputFormat.RawVideo{pixel_format: :I420}
    ]
  )
  |> child(:scaler, %Membrane.FFmpeg.SWScale.Converter{output_width: 160, output_height: 90})
  |> child(:encoder, Membrane.Transcoder)
  |> via_out(:output,
    options: [
      output_stream_format: %Membrane.Transcoder.OutputFormat.H264{stream_structure: :avc1}
    ]
  )
  |> child(:mp4_muxer, Membrane.MP4.Muxer.ISOM)
  |> child(:file_sink, %Membrane.File.Sink{location: "small.mp4"})
```

> Let's look at how it's written. The first element reads the video file. The video sits in a simple
> container called IVF, a file format that wraps the stream. The IVF deserializer pulls the
> compressed VP8 stream out of it. Then comes the first Transcoder, and instead of a compressed
> format we ask it for raw video in I420.

> Now we have raw frames. The next element is the scaler. It takes every frame and gives back a
> frame of a hundred and sixty by ninety pixels. Storing raw frames would take too much space, so a second
> Transcoder compresses them again, this time as H.264. A muxer packs
> that stream into an MP4 container. And a file sink writes it to disk.

**[7:10] Overlay `10-terminal.png`: a terminal panel with ffprobe on the resulting MP4, condensed
to the input, duration and stream lines, the codec and the resolution highlighted.**

<improwizacja>

**[7:40] Overlay `11-takeaway.png`.**

> So, a raw frame is a flat block of pixels, read with a resolution and a pixel format. Raw audio is
> a series of samples, read with a sample rate, a sample format and the number of channels. Raw data
> doesn't describe itself. The description travels alongside it, and in Membrane that's the stream
> format.

> Thank you for watching, and see you in the next episode.

**[8:05] End**

---

## Version B (room for you)

**Hook, pick one:**

1. The hex dump of a frame: "you can't draw this, because nothing in here says how".
2. `[YOU: the first time you opened a .yuv or .raw file in a hex editor, or in an image viewer
   with the wrong width, and what it looked like]`
3. ffprobe on the small MP4 the pipeline made, next to the thought of raw frames nobody could
   play without being told the format.

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
7. The pipeline: why raw matters (an AI model on the frames, a poor network), decode to raw,
   scale down to a third, encode again, to H.264, and mux into an MP4; code from Keynote top to
   bottom; the scaler sends a new stream format with the new size.
8. On camera: ffprobe on the result shows the codec and the resolution because the MP4 carries them;
   raw frames would have needed all of that spelled out. `[YOU: play small.mp4 live if you like,
   with -x 640 so the window is not tiny]`
9. Takeaway, then a plain goodbye. No promise about the next topic.

**What not to do:** no colour science (no colour spaces, no chroma siting, no limited range, no
HDR), no other pixel formats than RGB and I420, no stride or alignment, no colour inversion or any
custom element (that is a later episode), no timestamps beyond the one clause about the frame
rate, no claim that the stream format carries the frame rate (in this run it doesn't), no "audio
frame" (say sample), don't call I420 compression, don't call RGB what the decoder gives you, don't
read sizes off `ls -lh` (it prints 151M for the same file).