# 05 · What a video frame looks like in memory

| | |
|---|---|
| Type | CONCEPT |
| Length | 5-6 min |
| SEO title | "Raw video explained: frames, resolution, RGB vs YUV, and how to invert colors with math (Multimedia 101 #5)" |
| Keywords | raw video, rgb vs yuv, i420, pixel format, what is a frame, chroma subsampling, invert colors |
| Source | Ch. 2 slides "Raw video and RGB", "Color inversion", DEEP_DIVE Ch. 2 sections Resolution, Pixel format |
| On screen | Hexdump of a frame. The 2×2 grid of bytes from the slide. RGB vs I420 graphic (3 planes). An Elixir comprehension over a binary. |

## Facts that must land

- Raw video = a sequence of frames. A frame = a binary, exactly as it sits in memory.
- To read it you need two things: the resolution and the pixel format. Without them it's noise.
- Pixels are laid out row by row. The address of pixel `(x, y)` with `n` bytes per pixel: `(y * width + x) * n`.
- RGB: 3 bytes per pixel, 0-255 each. The 2×2 example from the slide.
- I420 (YUV 4:2:0, planar): brightness for every pixel, color for 2×2 blocks. 1.5 bytes per pixel. Codecs and most players work this way because the eye is more sensitive to brightness than to color.
- Color inversion: `255 - value` for every byte. Original + inverted = white.
- In Membrane: `%Membrane.RawVideo{width, height, pixel_format, framerate}` is the stream format that travels alongside the buffers. A buffer's payload = one frame.

---

## Version A (detailed)

**[0:00] Cold open. Terminal, `xxd` of the first lines of a raw frame (prepare the file: `ffmpeg -i assets/bbb_vp8.ivf -frames:v 1 -pix_fmt rgb24 -f rawvideo frame.rgb`).**

> This is a video frame. Not a JPEG, not a PNG. The frame itself, as a decoder hands it to a
> screen. Three hundred eighty-eight thousand bytes. If I don't tell you anything else about it,
> you cannot draw it. It's noise.

(388,800 = 480 × 270 × 3; if you use a different clip, recompute.)

**[0:15] Bumper**

**[0:20] On camera**

> In the codecs episode I said: in the middle of a transcoding chain you hold raw media, and
> that's the only place you can touch it. This episode is about what you're touching. Frames,
> resolution, pixel formats. And we'll do the simplest possible image effect, with one subtraction.

**[0:40] Frame and resolution. The 3×3 grid from the deep dive, bytes laid out as one strip, then folded into rows.**

> A raw video stream is a series of images called frames. Each frame is one flat binary.
> Pixels, one after another, row by row. Top row first, left to right, then the second row.

> So the first thing you need to know is the resolution: how many pixels wide. That's where the
> binary "wraps". If a pixel takes `n` bytes, the pixel at column `x`, row `y` starts at:

**[1:10] Formula on screen: `(y * width + x) * n`**

> Skip `y` full rows, each `width` pixels long, then `x` more pixels. Multiply by the bytes per
> pixel. Every image library in existence has this line somewhere.

**[1:25] Pixel format: RGB. The 2×2 slide.**

> The second thing you need is the pixel format: what those `n` bytes mean. The one you know
> is RGB. Three bytes per pixel: red, green, blue, zero to two fifty-five. Here's a two-by-two
> frame, twelve bytes. First three bytes, top-left pixel. Next three, top-right. Then the
> second row.

> Simple, direct, and nobody uses it for video.

**[1:50] Pixel format: YUV / I420. Graphic: one frame split into three planes: Y full-size, U and V a quarter each.**

> Codecs, cameras, players, almost all of them work in YUV. Instead of three colors, you store
> brightness, called luma, Y, and two color-difference channels, U and V. Why? Because your eye
> is much better at seeing brightness than color. So you keep full-resolution brightness and
> you store color for every two-by-two block of pixels, once.

> The most common layout is called I420. Planar: all the Y bytes first, a full-size grayscale
> image. Then all the U bytes, a quarter-size image. Then all the V bytes, another quarter.
> One and a half bytes per pixel instead of three. Half the memory, before any codec even starts,
> and you genuinely can't see the difference.

> You'll meet I420 again in the timestamps episode: the video player used there accepts nothing else.

**[2:45] Color inversion. The "Color inversion" slide.**

> Now let's do something to a frame. Color inversion: replace each color with its complement,
> the value that adds up to two fifty-five. Red 200 becomes 55. White becomes black. Add the
> inverted image to the original, pixel by pixel, and you get pure white.

> In RGB every byte is one color value. So inverting a frame is inverting every byte. You don't
> even need the resolution for this one; you need it for anything that cares *where* a pixel is,
> like "only the bottom half".

**[3:15] In Elixir. Snippet.**

> This is where Elixir is a joy. A frame is a binary, and Elixir has comprehensions over binaries:

```elixir
for <<byte <- frame>>, into: <<>>, do: <<255 - byte>>
```

> Take every byte, subtract from 255, build a new binary. One line, and it reads like the
> definition. You could also convert the binary to a list, map over it and convert back, which
> is clearer the first time you see it, but this is the idiomatic form.

**[3:40] In Membrane: stream format.**

> In Membrane, remember the thing I said at the start: a frame is noise without resolution and
> pixel format. So they travel with the stream. Before the first buffer, an element sends a
> stream format down the pad. For raw video it's this struct:

```elixir
%Membrane.RawVideo{width: 480, height: 270, pixel_format: :RGB, framerate: {25, 1}}
```

> Every element downstream gets it and knows how to read the payloads that follow. And each
> buffer, each `Membrane.Buffer`, carries exactly one frame in its `payload`. The payload is the
> binary from the hexdump. That's it, there's no wrapper, no object. Bytes you can pattern match.

**[4:15] Lead-in to the element episode.**

> So, a filter that inverts colors is: accept RGB raw video on the input pad, for each buffer
> invert the payload, send it out. Next episode we read through exactly such an element, line
> by line, and see what every Membrane element is made of.

**[4:30] Takeaway + next**

> A frame is a flat binary. Resolution tells you where it wraps, pixel format tells you what the
> bytes mean. RGB is for humans, YUV is for machines. Next: the anatomy of a Membrane element,
> in about twenty lines.

**[4:50] End**

---

## Version B (room for you)

**Hook, pick one:**

1. Hexdump: "This is a video frame. Without two numbers, it's noise."
2. `[YOU: your first encounter with a raw .yuv or .rgb file? Opened it at the wrong resolution and
   saw what? A skewed image, a green image, stripes? That's a great picture to show.]`
3. Show a frame at the right resolution and at the wrong one (`ffplay -f rawvideo -pix_fmt rgb24 -video_size 481x270 frame.rgb`),
   one pixel too many and the image "shears". Ask why, answer in the episode.

**Beats:**

1. Frame = flat binary, row by row.
2. Resolution = where the binary wraps. Formula `(y * width + x) * n`.
3. RGB: 3 bytes, the 2×2 example. "Nobody uses it for video."
4. YUV/I420: luma + chroma, 2×2 block, planar, 1.5 B/px. `[YOU: your take on how often people
   lose a day to a mixed-up pixel format? A concrete example?]`
5. Inversion: `255 - v`. Original + inverted = white.
6. Elixir: comprehension over a binary. `[YOU: why are Elixir binaries good for multimedia?
   Pattern matching on headers, sub-binaries without copying…]`
7. Membrane: `%Membrane.RawVideo{}` as stream format, buffer = one frame in `payload`.
8. Next: anatomy of a Membrane element.

**What not to do:** don't go into other YUV formats (NV12, YUYV), color spaces (BT.709),
or range (limited/full). One sentence, "there are dozens of pixel formats", is enough.
