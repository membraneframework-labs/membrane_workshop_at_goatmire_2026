# 09 · Reading a real element: switching between two streams

| | |
|---|---|
| Type | MEMBRANE |
| Length | 7-8 min |
| SEO title | "Server-side ad insertion, explained through one Elixir module (Membrane StreamSwitcher) (Multimedia 101 #9)" |
| Keywords | server side ad insertion, ssai, stream switching, splice video streams, manual demand, timestamp offset, membrane filter example |
| Source | Ch. 3 slides "Task 3.2" hints (as background only); `lib/stream_switcher.ex` on `chapter-3-checkpoint`, shown as a finished example; DEEP_DIVE Ch. 3 "Timestamps" and "Flow control" |
| On screen | The full `StreamSwitcher` module in an editor, scrolled section by section, with the current function highlighted. A diagram: `:main` and `:ad` pads into one box, `:output` out. A timeline sketch: main 0-15 s, ad, main resumes, with the offset arrow. Optional clip: a video with an ad cut in at 15 s and the main stream resuming. |

## Facts that must land

- The use case: ad insertion. Two inputs, `:main` and `:ad`, one output, a `switch_time` option. Forward main up to and including the first buffer with `pts >= switch_time`, then ad until it ends, then main from where it paused. Output timeline continuous. End of stream only when both inputs have ended.
- "From where it paused" means main must not be consumed during the ad. You pause an input by not demanding from it. That's why all pads are `:manual`.
- `handle_demand` demands exactly **one** buffer from the **active** pad. One, so you always know which pad the next buffer comes from. Active only, so the other input simply waits.
- `redemand: :output` after every forwarded buffer and at every switch; otherwise `handle_demand` isn't called again and the pipeline stops.
- Offset per segment: first buffer of the new segment lands one frame after the last buffer sent. `offset = last_pts + estimated_duration - buffer.pts`, applied to both `pts` and `dts`. Duration estimated from the gap between the last two frames, which assumes a constant frame rate.
- `handle_end_of_stream/3` fires per input pad. The default forwards it immediately, so the element overrides it and tracks which inputs have ended.
- `handle_stream_format`: forward the first one received, raise if the other input's differs.
- `accepted_format: _any`, so the same module works for raw video and raw audio. Audio timestamps come from `RawAudioParser`. Switching on raw frames avoids the reference-frame problems that encoded H.264 would have.

---

## Version A (detailed)

**[0:00] Cold open. Optional clip: a video, a cut to an ad, a cut back to where the video stopped. Or: the timeline sketch.**

> Main stream, ad, main stream from exactly where it stopped. No gap, no jump in time. Streaming
> platforms call this server-side ad insertion and charge money for it. In Membrane it's one filter
> module, about a hundred lines, and reading it is the best way I know to see timestamps and
> flow control doing real work.

**[0:20] Bumper**

**[0:25] On camera, diagram: two inputs, one output.**

> This episode is a read-through. One finished element, called `StreamSwitcher`, section by
> section. It uses manual flow control from episode eight and timestamps from episode seven. If
> those are new, the links are below; here I'll assume them.

**[0:40] What it does. Slide with the five rules, highlighted one by one.**

> The contract. Two input pads, `main` and `ad`, one output, and an option, `switch_time`. One:
> forward `main` up to and including the first buffer whose PTS is at or past the switch time.
> Two: forward `ad` until it ends. Three: forward `main` again, from where it was paused. Four:
> shift timestamps so the output timeline stays continuous. Five: send end of stream only when
> both inputs have ended.

> Rule three is the whole difficulty. "From where it was paused" means that while the ad plays,
> not a single frame of `main` may be consumed. Not read and thrown away. Not read at all. The
> file source upstream has to stop. And in a pipeline where the consumer sets the pace, the way
> to stop a source is to stop asking.

**[1:30] Pads and options. Editor, top of the module.**

```elixir
def_input_pad :main, accepted_format: _any, flow_control: :manual, demand_unit: :buffers
def_input_pad :ad, accepted_format: _any, flow_control: :manual, demand_unit: :buffers
def_output_pad :output, accepted_format: _any, flow_control: :manual, demand_unit: :buffers

def_options switch_time: [spec: Membrane.Time.t(), description: "..."]
```

> Three pads, all manual, demand counted in buffers. `accepted_format: _any`: the switcher doesn't
> care what flows through it, as long as both inputs carry the same thing. We'll come back to why
> that matters. And the option, a `Membrane.Time` value.

**[1:55] State.**

```elixir
defstruct [:switch_time, stream_format: nil, active: :main,
           main_eos?: false, ad_eos?: false, offset: nil, last_frame: nil]
```

> Which pad is active. Which pads have ended. The current timestamp offset. And the last frame
> we sent, with an estimate of its duration, for computing the next offset.

**[2:10] handle_demand: the heart.**

```elixir
@impl true
def handle_demand(:output, _size, :buffers, _ctx, %{active: active} = state) do
  {[demand: {active, 1}], state}
end
```

> Here's the whole trick, in one line. Whatever downstream asks for, we demand exactly one
> buffer, from the active pad only. One, so that we always know which pad the next buffer comes
> from and nothing is in flight when we switch. Active pad only, so `main` is never asked while
> the ad plays. Its source stops reading and waits. No frames consumed, no frames lost. That's
> what manual flow control buys you: the ability to pause an input by not demanding from it.

**[2:50] handle_buffer for :main.**

```elixir
@impl true
def handle_buffer(:main, buffer, _ctx, %{active: :main} = state) do
  {buffer_actions, state} = forward(buffer, state)

  {next_actions, state} =
    if state.ad_eos? or buffer.pts < state.switch_time,
      do: {[redemand: :output], state},
      else: switch_to(:ad, state)

  {buffer_actions ++ next_actions, state}
end
```

> A `main` buffer arrives. We forward it, with adjusted timestamps, `forward` is coming up. Then: is
> it time to switch? If the PTS is still before the switch time, or the ad has already played, we
> redemand, which calls `handle_demand`, which asks `main` for one more. Otherwise we switch to `ad`.

> Notice the pattern match on `active: :main`. A buffer from a pad that isn't active would be a
> bug in our own logic, and we want it to crash loudly rather than be silently forwarded.

```elixir
defp switch_to(pad, state) do
  {[redemand: :output], %{state | active: pad, offset: nil}}
end
```

> Switching: change the active pad, forget the offset so it's recomputed for the new segment,
> and redemand, so `handle_demand` runs and asks the *new* pad. That redemand is the rule from
> episode eight. Leave it out and the pipeline stops. Not crashes. Stops.

**[3:45] handle_buffer for :ad.**

```elixir
@impl true
def handle_buffer(:ad, buffer, _ctx, %{active: :ad} = state) do
  {buffer_actions, state} = forward(buffer, state)
  {buffer_actions ++ [redemand: :output], state}
end
```

> The ad is simpler: forward, redemand, until it ends.

**[3:55] Timestamps: forward and the offset. Timeline sketch next to the code.**

```elixir
defp forward(buffer, %{offset: nil} = state) do
  offset =
    case state.last_frame do
      nil -> 0
      {last_pts, duration} -> last_pts + duration - buffer.pts
    end

  forward(buffer, %{state | offset: offset})
end

defp forward(%{pts: pts, dts: dts} = buffer, %{offset: offset} = state) do
  out_pts = pts + offset
  out_dts = dts && dts + offset
  buffer = %{buffer | pts: out_pts, dts: out_dts}

  duration =
    case state.last_frame do
      nil -> 0
      {last_pts, _} -> out_pts - last_pts
    end

  {[buffer: {:output, buffer}], %{state | last_frame: {out_pts, duration}}}
end
```

> Two clauses. The first runs once per segment, when the offset is nil: the new segment's first
> frame should land one frame after the last one we sent. Last PTS, plus the last frame's
> duration, minus this buffer's PTS: that's the shift. The second clause applies the shift to
> both PTS and DTS, sends the buffer, and remembers it as the new last frame.

> Why estimate the duration from the gap between the last two frames? Because nothing here tells
> us the frame rate. It assumes a constant frame rate, and the real code says so in a comment.
> Episode seven, "best effort".

> And why bother at all? The ad starts at zero; the main stream is at fifteen seconds. Without the
> offset, a Realtimer downstream would see a frame stamped "zero" after one stamped "fifteen" and
> wait for a time that, as far as it's concerned, is fifteen seconds in the future. The output
> timeline has to be one continuous line, and the offset is what draws it.

**[5:05] End of stream.**

```elixir
@impl true
def handle_end_of_stream(:main, _ctx, state), do: maybe_finish(%{state | main_eos?: true})

@impl true
def handle_end_of_stream(:ad, _ctx, state), do: maybe_finish(%{state | ad_eos?: true})

defp maybe_finish(state) do
  cond do
    state.main_eos? and state.ad_eos? -> {[end_of_stream: :output], state}
    state.main_eos? -> switch_to(:ad, state)
    true -> switch_to(:main, state)
  end
end
```

> `handle_end_of_stream` fires per input pad, and the default implementation forwards it
> immediately, which would end our output the moment the ad ends. So the element takes over.
> Both ended: end the output. Only `main` ended, meaning the main stream was shorter than the
> switch time: play the ad now and finish after it. Only `ad` ended, the normal case: back to `main`.

**[5:40] Stream format.**

> One more callback. `handle_stream_format`: the first format that arrives, on either pad, is
> forwarded and remembered. If the other pad later reports the same one, nothing happens. If it
> reports a different one, the element raises, with both formats in the message. Switching
> mid-stream between, say, two resolutions is not something the element downstream will handle,
> so it's better to fail at the first buffer than to produce garbage.

**[6:05] Why this works for audio too, and why raw.**

> Two closing observations. First: nothing in this module says "video". `accepted_format: _any`,
> timestamps, demand in buffers. Put raw audio through it and it inserts an audio ad at the same
> fifteen seconds, with `RawAudioParser` providing the timestamps that MP3 doesn't have. Two
> switchers, one for video and one for audio, not connected to each other, only agreeing on the
> number fifteen, and the cut lands in sync. That's what good timestamps buy you.

> Second: this switches on *raw* frames, between a decoder and an encoder. Every frame is complete,
> so cutting anywhere is fine. Doing the same on encoded H.264 would mean worrying about reference
> frames, episode seven: you can't start a segment on a frame that refers to a frame you didn't
> send. Raw in the middle is the place where this kind of thing is easy.

**[6:45] Takeaway + next**

> Manual demand gives you a choice of input. One buffer at a time keeps the switch clean. An offset
> per segment keeps the timeline continuous. End of stream is per pad, and you decide what it means.
> A hundred lines, and every one of them is a concept from the previous two episodes. Next: we
> leave files behind. What WebRTC actually is, before we send a stream into a browser.

**[7:05] End**

---

## Version B (room for you)

**Hook, pick one:**

1. The cut clip or the timeline sketch. "The thing platforms charge money for, in one module."
2. `[YOU: have you done ad insertion commercially? What is actually hard about it in production
   that this module doesn't show (SCTE-35, bitrate matching, GOP alignment)? Say it upfront,
   as "this is the core idea, not the product".]`
3. The question: "How do you pause a stream without reading it?" That's the heart of manual
   flow control, and the module answers it in one line.

**Beats:**

1. The five rules. Rule 3 ("from where it paused") = `main` must not be read during the ad.
2. Pads: three manual, `_any`, buffers. `switch_time` option.
3. `handle_demand`: **one buffer from the active pad**. The most important slide of the episode.
4. `handle_buffer(:main)`: forward → check PTS → redemand or switch. Pattern match on `active`.
5. `switch_to`: change pad, reset offset, **redemand**.
6. `handle_buffer(:ad)`: forward + redemand.
7. `forward`: offset = last_pts + duration − pts. Why duration is estimated. Why a Realtimer stalls
   without the offset. `[YOU: your way of explaining "timeline continuity"? A train or clock analogy?]`
8. EOS per pad, the three cases in `cond`.
9. Stream format: first one forwarded, the other must match.
10. Format-agnostic → audio works too, two switchers agreeing on the number 15.
11. Raw frames: no reference-frame trouble; encoded would be a different story.
12. `[YOU: the time you forgot a redemand and stared at a frozen pipeline. How long did it take?]`
13. Next: WebRTC.

**What not to do:** don't present the module as something to write along; it's something to read.
Don't re-explain the three flow control modes, point to episode 08. Don't go into how the module
is wired into a pipeline beyond one sentence (`via_in(:main)` and `via_in(:ad)` pick the pads).
Don't mention branches or where the file lives.
