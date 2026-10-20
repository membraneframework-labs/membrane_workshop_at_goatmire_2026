# 11 · Why live streams are different: pace, push and the toilet

| | |
|---|---|
| Type | CONCEPT + MEMBRANE |
| Length | 5-7 min |
| SEO title | "Live vs file streaming: what changes when the source is a camera (latency, buffering, dropping frames) (Multimedia 101 #11)" |
| Keywords | live streaming latency, live vs vod, dropping frames vs buffering, webrtc camera to server, backpressure live source, bounded queue overflow |
| Source | `materials/Chapter 4/DEEP_DIVE.md` section "Live streams", Ch. 4 BONUS hints (toilet overflow, `getUserMedia` constraints, closing the sender), DEEP_DIVE Ch. 3 "Flow control" (push mode) |
| On screen | Two timelines side by side: a file being read in a burst, a camera producing frames at even intervals. Diagram: push output → [bounded queue] → pull input. Optional clip: two browser tabs, the sender with a camera and the receiver showing the same picture color-inverted, a hand wave arriving late after an ad. The overflow error message with the pad name highlighted. |

## Facts that must land

- A file can be read much faster than it should be played. A camera produces a frame every 1/30 s and can't be asked for more. That stream is **live**: its pace is set by the outside world.
- Two mirror-image consequences: nothing has to slow a live stream down (a Realtimer would only add delay). Nothing can slow it down either (the source pushes, `:push` flow control).
- Where a pushing output meets a pulling input, buffers wait in a bounded queue in front of the first pull-mode pad, called the toilet. Default capacity 200 buffers. Overflow crashes the pipeline on purpose, with the pad name in the message.
- Worked example: a stream switcher that pauses its main input during an ad, fed by a camera over WebRTC instead of a file. During a 14-second ad at 30 fps, about 420 video frames and even more audio chunks pile up. Overflow.
- The fix `via_in(:main, toilet_capacity: 5000)` works and has a price: after the ad the output is permanently 14 seconds behind the camera.
- The fundamental live trade-off: buffer and fall behind, or drop and lose content. There is no third option.
- Smaller points: inputs that must share a stream format should get the right resolution at the source (`getUserMedia` constraints) rather than a scaler in the pipeline. Closing the sender ends the stream, and the pipeline should end with it.

---

## Version A (detailed)

**[0:00] Cold open. Clip, if available: two browser tabs, the left one showing a camera, the right one showing the same picture color-inverted, half a second behind. A hand waves. Otherwise on camera.**

> That's a camera, going into a pipeline through a browser, and coming back out into another
> browser, half a second behind. The same pipeline, fed from a file, worked for ten episodes. Fed
> from a camera, it crashes about thirty seconds in. On purpose. This episode is about why.

**[0:20] Bumper**

**[0:25] On camera**

> For most of this series the source was a file. Today it's a camera, and three assumptions we've
> been making quietly stop being true. I think this is the most instructive failure in all of
> multimedia, so let's walk through it.

**[0:45] What live means. Two timelines side by side.**

> In the timestamps episode: a file can be read much faster than it should be played, so a
> Realtimer slows it down to the speed of its timestamps. A camera is different. It produces a
> frame every thirtieth of a second and there is no way to ask it for frames faster than that.
> Its pace is set by the outside world. That's what live means. Not "happening now", but: the
> stream has a pace you don't control.

> Two consequences, and they're mirror images. Nothing has to slow a live stream down; a Realtimer
> would only add delay. And nothing *can* slow it down. The source pushes buffers when they
> arrive. That's push flow control, from the backpressure episode, and now it's not a corner case,
> it's the front of your pipeline.

**[1:35] Where push meets pull. Diagram: push output → [queue] → pull input.**

> So what happens when a pushing source meets an element that pulls, one that demands buffers
> when it's ready for them? The pushing side doesn't listen to demands. Membrane puts a queue in
> front of the first pull-mode pad. That queue is called the toilet. It has a capacity, two
> hundred buffers by default, and when it fills up the pipeline crashes with a message that
> names the pad. The alternative is an unbounded queue and memory growing until the machine
> dies, and a loud crash naming the pad is the better failure.

**[2:10] The worked example. Diagram: camera → WebRTC input → decoder → switcher with :main and :ad.**

> Here's a concrete case. Take the stream switcher from the previous episode: two inputs, main
> and ad, one output. At fifteen seconds it stops asking its main input for frames, plays the ad
> to the end, then resumes main from where it paused. With a file as the main source that was
> free: "demand nothing" meant the file source stopped reading, and the bytes waited on disk.

> Now feed the main input from a camera over WebRTC instead. The switcher stops demanding from
> main for the fourteen seconds of the ad. The camera doesn't care. It keeps sending frames,
> thirty a second, whether anyone asks or not. They land in the toilet in front of the main pad.

**[2:50] The math. Numbers on screen.**

> Fourteen seconds, thirty frames a second: four hundred and twenty video frames. Audio comes in
> smaller chunks, so even more of those. The default capacity is two hundred. The ad ends, the
> toilet is long gone, and the pipeline is down. Read the error: the toilet in front of the main
> pad of the video switcher has overflowed.

**[3:15] The fix and its price. Code.**

```elixir
|> via_in(:main, toilet_capacity: 5000)
```

> The fix is one option on the link into the main pad: a bigger toilet. Five thousand buffers.
> Now the ad plays, the ad ends, the stream resumes. And look at what resumes. Every frame
> recorded during the ad was kept in the queue and is now being played, in order, after the ad.
> We lost nothing. We're also fourteen seconds behind the camera, and we'll stay fourteen seconds
> behind for as long as this stream lives. Wave at the camera now, see it in the receiver fourteen
> seconds later.

**[3:50] The trade-off. On camera, no slide.**

> That's the real lesson of live. When the consumer can't keep up with a source it can't slow
> down, you have exactly two options. Buffer, and fall behind. Or drop, and lose content. There
> is no third one. Every live system you've ever used, every video call, every live stream, has
> made this choice somewhere, and usually the answer is: drop, because a conversation that's
> fourteen seconds behind isn't a conversation. For the switcher, that would mean discarding main
> frames during the ad instead of queueing them. Different element, same question.

**[4:25] Two smaller traps, quickly.**

> Two smaller things that bite with live sources. First: elements that join streams often need
> identical stream formats on their inputs, and a camera doesn't come in the same resolution as
> your other content. You could put a scaler in the pipeline and pay the CPU, or ask the browser
> for the exact resolution in `getUserMedia`. One line of JavaScript beats a scaler.

> Second: when the person on the sending side closes their tab, the input stream ends, and the
> pipeline should end with it. That's not a bug to work around. Live streams end when the source
> goes away. Your pipeline sees end of stream, flushes, and terminates, exactly like it would at
> the end of a file.

**[5:00] Takeaway + next**

> Live means the pace isn't yours. Nothing has to slow it, nothing can. Where push meets pull,
> something has to queue, and when the queue is full you either wait or drop. Membrane makes you
> choose, out loud, with a capacity and a crash. Last episode of the series next: how you package
> a chunk of a pipeline into one component you can reuse, and the component that turns a URL into
> a WebRTC connection.

**[5:20] End**

---

## Version B (room for you)

**Hook, pick one:**

1. The two tabs, a hand wave, "it crashes thirty seconds in, on purpose".
2. `[YOU: the longest delay you've seen in a live system and why it was there. Or: a production
   story where "buffer vs drop" was a real business decision.]`
3. The toilet overflow message on a full screen, no context. "If you've ever seen this, this
   episode is for you."

**Beats:**

1. Live = the pace isn't yours. Two mirror consequences: nothing has to slow it, nothing can.
2. Push meets pull: a bounded queue in front of the first pull pad, 200 by default, deliberate
   crash with the pad name. `[YOU: where does the name "toilet" come from? If you know the
   story, this is the moment.]`
3. Worked example: the switcher pausing main during an ad, file source vs camera. "The camera
   doesn't care."
4. The math: 14 s × 30 fps = 420 frames, more audio chunks, capacity 200.
5. Fix: `toilet_capacity: 5000`. Works. Show the 14 s delay with a wave.
6. **Buffer or drop. No third option.** `[YOU: your opinion on how a dropping switcher should
   behave. Sketch it in three sentences?]`
7. Two traps: resolution via `getUserMedia`, closing the sender ends the pipeline and that's right.
8. Next: bins and Boombox, last episode.

**What not to do:** don't debug ICE and VPN on camera, that's a separate short episode if the
series continues. Don't go into the WebRTC jitter buffer. Don't present `toilet_capacity: 5000`
as "the solution", it's a trade-off, and say so out loud.
