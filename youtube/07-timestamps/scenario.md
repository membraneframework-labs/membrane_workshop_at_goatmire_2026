# 07 · PTS, DTS and why your video plays too fast

| | |
|---|---|
| Type | CONCEPT |
| Length | 6-7 min |
| SEO title | "PTS vs DTS: video timestamps explained, B-frames, and real-time playback (Multimedia 101 #7)" |
| Keywords | pts vs dts, presentation timestamp, decoding timestamp, b-frames, video plays too fast, real-time playback, offline vs online processing |
| Source | Ch. 3 slides "Timestamps", "Where timestamps come from", "Offline and online processing"; DEEP_DIVE Ch. 3 "Timestamps"; `presentation/public/i_p_and_b_frames.svg` |
| On screen | Optional demo clip: a 32 s file played through an SDL window without a Realtimer (flashes by in ~2 s), then with one (25 fps). The I/P/B diagram. A `Membrane.Buffer` struct with `pts` and `dts` highlighted. Two-column slide "Offline / Online". |

## Facts that must land

- Every chunk of media can carry two timestamps: PTS (when to present) and DTS (when to decode). In Membrane both sit on every `Membrane.Buffer`, as `Membrane.Time` values, which are nanoseconds.
- DTS is always strictly increasing. PTS can differ from it because of B-frames: a frame encoded relative to frames shown both before and after it has to be decoded earlier than it is shown.
- Timestamps usually come from the container. A raw H.264 stream has none; they appear after demuxing.
- They can be restored at a constant rate: audio always (sample rate), video only if the frame rate is constant. The offset of the whole stream is lost.
- Offline processing (file to file, as fast as possible) vs online (display, send to a peer: each chunk at its time).
- A camera paces itself. A file doesn't, so something has to slow it down based on timestamps: a realtimer.
- In Membrane: `Membrane.Realtimer` right before the sink; `Membrane.RawAudioParser` with `overwrite_pts?: true` for audio; `Membrane.H264.Parser` has `generate_best_effort_timestamps`, and the name is the warning.

---

## Version A (detailed)

**[0:00] Cold open. Demo clip: a pipeline playing a file into an SDL window, no Realtimer. The window opens, 32 seconds of video flash by in about two, the window closes.**

> That was the whole clip. Thirty-two seconds of video in about two. And here's the thing:
> nothing is broken. Every frame was decoded, every frame was drawn. The pipeline did exactly what
> it was asked to. Nobody asked it about time.

**[0:20] Bumper**

**[0:25] On camera**

> This episode is about time in multimedia. Timestamps: what they are, why a frame has two of
> them, where they come from, and what has to be in a pipeline so that a file plays at the speed it
> was shot. At the end we come back to that clip and make it behave.

**[0:45] PTS and DTS. Slide "Timestamps": a buffer struct with `pts` and `dts` highlighted.**

> Every chunk of media, a video frame, a few milliseconds of audio, can carry two timestamps.
> PTS, the presentation timestamp: when to *show* this. DTS, the decoding timestamp: when to
> *decode* this. In Membrane they sit on every buffer, in the `pts` and `dts` fields, as
> `Membrane.Time` values, which are nanoseconds under the hood.

> Why two? Most of the time they're equal and you can forget DTS exists. The exception is the
> interesting part.

**[1:15] B-frames. The I/P/B diagram.**

> Codecs save space by storing only what changed between frames. There are three kinds of frames.
> I-frames are complete pictures. P-frames reference the previous frame: "like the last one, but
> this moved". And B-frames reference both the previous frame *and the next one*: "halfway between
> those two".

> That's great for compression and terrible for ordering. To decode a B-frame you need the frame
> that comes *after* it on screen. So the encoder puts that later frame earlier in the stream.
> Decoding order and display order are different. DTS tracks decoding order and always goes up.
> PTS tracks display order and jumps around relative to it. Two timestamps, because there are
> two orders.

**[2:10] Where timestamps come from. Slide "Where timestamps come from".**

> Where do they come from? Usually, the container. An MP4 file has a timestamp for every sample.
> A raw H.264 stream has none; it's just frames, one after another. So right after a file source
> there are no timestamps, and after the demuxer there are. Sometimes you get both PTS and DTS,
> sometimes only one, sometimes none. It depends on where in the chain you're looking.

> What if they're missing? If the stream has a constant rate, you can rebuild them. Each chunk has
> a known duration, so the timestamp of a chunk is the sum of the durations of everything before it.
> Audio always works: raw audio is samples at a fixed sample rate, count the samples and you know
> the time. In Membrane that's what `Membrane.RawAudioParser` does with `overwrite_pts?` set to
> true: it counts the samples passing through and stamps each buffer with the total duration of the
> audio before it.

> Video only works if the frame rate is constant, and you can't tell that from the bytes. That's
> why the matching option on `Membrane.H264.Parser` is called `generate_best_effort_timestamps`.
> You give it a frame rate and it does its best, and the docs warn the result may drift out of sync
> with other media. The name is a warning.

> One thing you can never recover: the offset. Where in time did the stream start? If nothing says,
> any value is as good as any other, and elements that restore timestamps typically start at zero.

**[3:30] Offline vs online. Two-column slide.**

> Now, the clip from the beginning. Why did it play in two seconds? Because there are two kinds of
> processing. Offline: a file goes in, a file comes out. Timestamps are carried along and written
> into the output, but nothing *waits* for them. As fast as possible is correct, and that's what you
> want from a transcoder.

> Online: media is consumed as it flows. Displayed to a person, sent to a peer. Each chunk has to be
> delivered when its timestamp says. The clip was an online use, display, built out of offline parts.
> The file source reads at disk speed, the decoder decodes at CPU speed, and the player draws
> whatever it gets, as soon as it gets it.

**[4:10] Cameras vs files.**

> A camera doesn't have this problem. It produces a frame every thirtieth of a second, and you can't
> ask it to go faster. The pace comes from the world. A file has no pace. Somebody has to add one,
> based on the timestamps. Without it the viewer sees all the frames almost at once, which is what
> you saw.

**[4:30] Realtimer. Diagram: … → Realtimer → sink.**

> That somebody is a realtimer. It holds each buffer until that buffer's timestamp comes, then
> lets it through. Whatever speed the stream enters at, it leaves in real time. In Membrane it's
> `Membrane.Realtimer`, a filter from `membrane_realtimer_plugin`. You put it right before the sink,
> so that everything upstream can work ahead and the only thing waiting is the last step. The
> first buffer's timestamp becomes the starting point; everything after it is released relative to
> that.

**[5:00] The fix. Spec excerpt on screen.**

> Here's the end of that player pipeline, fixed. The decoder, a converter to I420, because the SDL
> player only accepts that pixel format, episode five, then the Realtimer, then the player.

```elixir
|> child(:pixel_format_converter, Membrane.Transcoder)
|> via_out(:output,
  options: [output_stream_format: %Membrane.Transcoder.OutputFormat.RawVideo{pixel_format: :I420}]
)
|> child(:realtimer, Membrane.Realtimer)
|> child(:sdl_player, Membrane.SDL.Player)
```

**[5:20] Demo clip: the same window, the video at 25 fps.**

> Twenty-five frames per second. Nothing else changed. The file source still reads as fast as it
> can; it just can't get far, because the Realtimer holds the line and that pressure travels back
> up the chain, element by element. How that pressure works is the next episode.

**[5:50] Takeaway + next**

> PTS is when to show, DTS is when to decode, B-frames are why they differ. Timestamps come from the
> container, can be rebuilt at a constant rate, and only matter for pacing when something is
> watching. Next: backpressure. What exactly happens when a fast element feeds a slow one, and the
> three ways Membrane lets you control it.

**[6:10] End**

---

## Version B (room for you)

**Hook, pick one:**

1. The "whole clip in two seconds" demo. Strongest hook in the series, don't talk over it. Measure
   beforehand how long it really takes without a Realtimer and say the true number.
2. `[YOU: the worst timestamp bug you've seen. Audio-video desync? Negative PTS? A wrap-around
   after 26 hours in MPEG-TS?]` Then: "all of that is this episode".
3. The question: "Why does a frame need two timestamps?" Hold it, bumper, answer halfway through.

**Beats:**

1. PTS = show, DTS = decode. `Membrane.Time`, nanoseconds, on every buffer.
2. B-frames: the I/P/B diagram. Two orders, two timestamps. `[YOU: an anecdote about B-frames
   ruining someone's day, e.g. latency in live, "closed GOP"?]`
3. Where from: the container. Raw H.264 has none. Restoring at constant rate: audio yes
   (`RawAudioParser`), video "best effort". The offset is lost. The option name as the punchline.
4. Offline vs online. "An online use built out of offline parts."
5. A camera has a pace, a file doesn't. The Realtimer adds one.
6. The fix: converter to I420 → Realtimer → player. Demo clip at 25 fps.
7. One sentence on "pressure travels back", teaser for episode 08.
8. Next: backpressure.

**What not to do:** don't explain GOP, IDR, open vs closed GOP. Don't go into clock drift, PCR,
NTP or synchronisation between devices. Don't explain yet *how* the Realtimer "holds the line"
upstream, that's flow control. Don't frame the pipeline as something the viewer is supposed to
build; it's a clip that makes a point.
