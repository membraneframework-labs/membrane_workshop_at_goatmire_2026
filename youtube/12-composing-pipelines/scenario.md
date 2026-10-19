# 12 · Bins, dynamic pads and notifications: composing pipelines

| | |
|---|---|
| Type | MEMBRANE |
| Length | 6-7 min |
| SEO title | "Composing media pipelines in Elixir: Membrane bins, dynamic pads and Boombox (stream to a browser over WebRTC) (Multimedia 101 #12)" |
| Keywords | membrane bin, elixir webrtc, stream video to browser elixir, boombox membrane, dynamic pads, membrane child notification |
| Source | Ch. 4 slides "Bins", "Boombox", "Child notifications", `materials/Chapter 4/DEEP_DIVE.md` sections "Bins" and "Building blocks", Ch. 1 BONUS hints (demuxer `kind:` pad option, `:new_tracks` notification, dynamic pads), the Boombox pipeline on `chapter-4-checkpoint` as a finished example to show |
| On screen | Diagram of a bin: a box with pads on the outside and a small graph inside. Diagram of a demuxer with one output pad per track. A spec with two branches meeting in one `Boombox.Bin`. Optional clip: a browser tab playing a stream from a pipeline. Series wrap-up card at the end. |

## Facts that must land

- `Membrane.Bin`: a group of elements, possibly other bins, packed into one component. From the outside it looks like an element: it has pads, you link it with `child`. On the inside it has its own children and its own spec, like a pipeline. Bins are the way to reuse a piece of a pipeline as a whole.
- `Membrane.Transcoder` is itself a bin: a decoder, converter and encoder inside, picked from the formats.
- Dynamic pads: created when linked, several instances of the same pad. Example: `Membrane.MP4.Demuxer.ISOM` has one output per track; for the common audio + video case you pick a track with `via_out(:output, options: [kind: :audio])`. When you don't know the tracks upfront, the demuxer sends a `:new_tracks` notification and you link the pads then.
- Child notifications are how children talk to the parent. They arrive in `handle_child_notification/4` with the child's name.
- Boombox: a tool on top of Membrane for moving media between formats and protocols: files, HLS, RTMP, RTSP, WebRTC and more. `Boombox.Bin` with `:output` set is a sink, with `:input` set a source. Dynamic pads, one for audio and one for video, chosen with the `kind:` pad option.
- `{:webrtc, "ws://localhost:8830"}`: Boombox starts a WebSocket signaling server on that port and waits for a browser. It has a Transcoder inside, so it takes raw video in any pixel format and raw audio. It paces a non-live stream itself. It sends `:processing_finished` when done.
- Finished example: a video source and an audio source both linked into one `Boombox.Bin` with WebRTC output; the pipeline terminates on `:processing_finished`.

---

## Version A (detailed)

**[0:00] Cold open. Clip, if available: a browser tab playing a video with sound, the address bar showing localhost. Otherwise on camera.**

> That's a Membrane pipeline playing into a browser tab over WebRTC. The part of the spec that
> does the WebRTC: one child and a URL. Everything we talked about two episodes ago, signaling,
> ICE, RTP, encoding for the browser, is inside that one child. Today is about how Membrane lets
> you pack things like that into a box, and three features that make the box work.

**[0:20] Bumper**

**[0:25] On camera**

> Last episode of the series. Three Membrane features that are about composition: bins, dynamic
> pads and child notifications. Then one finished example that uses all three to put a stream
> into a browser.

**[0:40] Bins. Diagram: a box with pads outside, a small graph inside.**

> So far every component in a pipeline was an element: one process, one job. A `Membrane.Bin` is
> a group of elements, possibly other bins, packed into a single component. From the outside it
> looks like an element: it has pads, you link it in a spec with `child`, same as anything else.
> On the inside it has its own children and its own spec, exactly like a pipeline does.

> Why? Reuse. "Decode whatever comes in, convert the pixel format, encode to H.264" is a chain of
> three or four elements, and the right ones depend on what arrives. If you need that in several
> pipelines, you write a bin once. You've been using one since the codecs episode: the Transcoder.
> It has a decoder, a converter and an encoder inside, chosen at runtime from the stream formats,
> and you never saw them. You declared the output format on its pad and linked it like an element.

**[1:35] Dynamic pads. Diagram: a demuxer with outputs appearing as tracks are linked.**

> Second feature. The pads we've seen so far were static: an element has `:input` and `:output`,
> always, one of each. Some elements can't know upfront how many pads they'll need. A demuxer
> reading an MP4 has one output per track, and a file can have two tracks or six. So the pad is
> dynamic: declared once, instantiated each time you link it.

> For the most common case, one audio track and one video track, you say which is which with a pad
> option:

```elixir
child(:demuxer, Membrane.MP4.Demuxer.ISOM)
|> via_out(:output, options: [kind: :audio])
|> child(:audio_decoder, ...),

get_child(:demuxer)
|> via_out(:output, options: [kind: :video])
|> child(:video_decoder, ...)
```

> Two links to the same pad name, two pad instances. And when you genuinely don't know what's in
> the file, the demuxer tells you: it sends a `:new_tracks` notification with the tracks it found,
> and you return a spec linking the right pads from there. Which brings us to the third feature.

**[2:30] Child notifications.**

> Children can talk to the pipeline. A notification is any term a child sends up, and the parent
> receives it in `handle_child_notification`, together with the child's name:

```elixir
@impl true
def handle_child_notification(:processing_finished, :webrtc_output, _ctx, state) do
  {[terminate: :normal], state}
end

@impl true
def handle_child_notification(_notification, _child, _ctx, state) do
  {[], state}
end
```

> Match on the notification and the child, return actions. Ignore everything else; bins in
> particular are chatty. This is the channel for "I found these tracks", "I'm connected", "I'm
> done", anything the pipeline needs to know that isn't a buffer.

**[3:00] Boombox. Slide.**

> Now the example. Boombox is a tool built on Membrane for moving media between formats and
> protocols. Files, HLS, RTMP, RTSP, WebRTC and more. It has a one-call API, "take this input,
> produce this output", and it has `Boombox.Bin`, the same thing as a component you can put in
> your own pipeline, next to your own elements.

> `Boombox.Bin` with the `:output` option set is a sink: you link into its input pads. With
> `:input` set, it's a source. Its pads are dynamic, up to one for audio and one for video, chosen
> with the `kind` pad option. The same shape as the demuxer.

> A WebRTC endpoint is written as `{:webrtc, url}`. With a WebSocket URL, Boombox starts a
> signaling server on that port, the WebRTC episode, and waits for a browser to connect. It has a
> Transcoder inside, so it takes raw video in any pixel format and raw audio, and encodes to
> whatever the browser negotiates. And it paces a non-live stream by itself, so there's no
> Realtimer in front of it.

**[3:55] The finished example. Spec on screen, highlight line by line.**

```elixir
spec = [
  child(:video_source, ...)
  |> child(:video_decoder, Membrane.Transcoder)
  |> via_out(:output,
    options: [output_stream_format: %Membrane.Transcoder.OutputFormat.RawVideo{pixel_format: :RGB}]
  )
  |> via_in(:input, options: [kind: :video])
  |> child(:webrtc_output, %Boombox.Bin{output: {:webrtc, "ws://localhost:8830"}}),

  child(:audio_source, ...)
  |> child(:audio_decoder, Membrane.Transcoder)
  |> via_out(:output, options: [output_stream_format: %Membrane.Transcoder.OutputFormat.RawAudio{...}])
  |> via_in(:input, options: [kind: :audio])
  |> get_child(:webrtc_output)
]
```

> Two branches. The video branch: a source, a Transcoder decoding to raw RGB, and then
> `via_in(:input, options: [kind: :video])` into the Boombox child with a WebRTC output. The audio
> branch: a source, a Transcoder decoding to raw audio, `via_in` with `kind: :audio`, and
> `get_child`, because the Boombox already exists. Two inputs into one component, the same pattern
> a muxer uses. It is a muxer, in a sense: two tracks going into one WebRTC session.

> And the notification handler from a minute ago closes the loop: Boombox sends
> `:processing_finished` when the stream has been delivered, and the pipeline terminates.

**[4:50] What happens at runtime. Optional clip: the browser tab connecting.**

> At runtime: the pipeline starts and waits. Nothing flows until a browser shows up; Boombox is
> holding the door. The browser side needs a small page with JavaScript that opens the WebSocket,
> exchanges the offer, answer and candidates, and attaches the incoming stream to a video element.
> Click connect, and the raw frames from your pipeline get encoded, packed into RTP and sent to
> the tab. The elements upstream of the Boombox never find out that the other end is a browser.

> When the source ends, the Boombox flushes, reports `:processing_finished`, and the pipeline
> terminates. Close the tab early and the connection drops, which ends the processing too.

**[5:25] Series wrap-up. Card with the episode list.**

> That's the end of the series. If you've watched all of it, here's what you now have. You know
> what a codec does and what a container does, and that those are two different things. You know
> what a raw frame is in memory, and why a frame has two timestamps. You know what backpressure
> is and why it has to exist in any pipeline. You know how WebRTC gets video from one machine to
> another, and why a live source changes the rules. And you know how Membrane expresses all of
> that: elements, pads, buffers, specs, demands, bins.

> The code for every example is in the repo linked below. If something in it helped, a star on
> the Membrane repo helps us. And if you build something with it, tell us. See you around.

**[6:10] End**

---

## Version B (room for you)

**Hook, pick one:**

1. The browser tab, address bar on localhost. "One child and a URL."
2. `[YOU: where did Boombox come from? What problem was it built to solve? A short product
   story as the way in.]`
3. Open with the Transcoder: "You've been using a bin since episode one and I didn't tell you."

**Beats:**

1. Bin: outside an element, inside a spec. Reuse. **The Transcoder was a bin all along.**
   `[YOU: your favourite bin in the ecosystem and why?]`
2. Dynamic pads: declared once, instantiated per link. The demuxer with `kind:`; `:new_tracks`
   when you don't know the tracks.
3. Child notifications: `handle_child_notification/4`, name of the child, "bins are chatty".
4. Boombox: protocols, one-call API or a bin. Sink or source by option. Dynamic pads, `kind:`.
   `{:webrtc, "ws://..."}` = a signaling server. Transcoder inside. Paces itself.
5. The finished spec: two branches into one Boombox, `via_in(kind:)`, `get_child`. "It's a muxer,
   in a sense."
6. `:processing_finished` → terminate. What happens at runtime, the browser holding the door.
7. Series wrap-up. `[YOU: this is the outro of the whole series, give yourself 30 seconds. What
   do you hope people build? Where can they find you and Membrane?]`

**What not to do:** don't show the JavaScript page for more than a few seconds. Don't explain
what's inside Boombox (which WebRTC elements). Don't re-explain the WebRTC phases, one sentence
and a card pointing at that episode. Don't tease a next episode; this is the end.
