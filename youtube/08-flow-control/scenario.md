# 08 · Backpressure: who sets the pace in a media pipeline

| | |
|---|---|
| Type | CONCEPT + MEMBRANE |
| Length | 6-8 min |
| SEO title | "Backpressure explained with video: push vs pull, demand, and Membrane's three flow control modes (Multimedia 101 #8)" |
| Keywords | backpressure, push vs pull streaming, flow control, producer consumer problem, erlang mailbox overflow, membrane demand |
| Source | Ch. 3 slides "Flow control", "Three flow control modes", "Manual flow control", "Demand and redemand"; DEEP_DIVE Ch. 3 "Flow control"; DEEP_DIVE Ch. 4 "Live streams" (the toilet) |
| On screen | Animation: fast producer, slow consumer, a queue growing between them. Three-column slide `:auto` / `:push` / `:manual`. The `PassThrough` snippet. The demand table (5 → 4 → 3 → 2 → 5). The "drop every other buffer" snippet. |

## Facts that must land

- Every element is a process with its own mailbox. A fast producer and a slow consumer with no limit means memory grows until the system goes down.
- The slowest element should set the pace, not the fastest.
- Backpressure = the consumer tells the producer how much it can take. In Membrane: demands.
- Configured per pad with `flow_control` in `def_input_pad` / `def_output_pad`. Three modes:
  - `:auto` (default): the framework computes the demand from the neighbours and the element's own pace. You only write `handle_buffer`.
  - `:push`: no backpressure. Output sends whenever it wants, input has to keep up. For a pace set from outside, like network packets.
  - `:manual`: pull. Nothing arrives on an input until you ask with a `demand` action. Demand on an output is handled in `handle_demand/5`.
- `:auto` and `:push` are nearly interchangeable in code. `:manual` needs `handle_demand` and `demand` actions.
- `demand` on an input **overwrites** the current demand, it doesn't add. You're guaranteed not to receive more than you demanded. If you can't satisfy the whole output demand (you dropped a buffer), return `redemand: :output`.
- `demand_unit` is `:buffers` or `:bytes`; Membrane converts between units on a link.
- Where push meets pull, Membrane keeps a bounded queue, the toilet, default 200 buffers. Overflow crashes, on purpose.
- Symptom: a missing redemand makes the pipeline stop, not crash.

---

## Version A (detailed)

**[0:00] Cold open. On camera, no slide.**

> A file source can read a gigabyte in a second. A video encoder cannot encode a gigabyte in a
> second. Connect them with an arrow, the way every media pipeline does, and ask: where does the
> difference go?

**[0:15] Bumper**

**[0:20] On camera**

> It goes into memory. And then into more memory. This episode is about backpressure: the mechanism
> that stops that from happening, how it works in a pipeline made of processes, and the three ways
> Membrane lets you control it. If you've seen `flow_control: :auto` in a Membrane element and
> wondered what it was about, this is the episode.

**[0:40] The problem. Animation: two boxes, the queue between them grows.**

> Every element in Membrane is a process with a mailbox. The file source sends buffers to the
> decoder's mailbox. If the decoder is slower, the mailbox grows. There's no limit on an Erlang
> mailbox. A half-minute clip is eight hundred frames, a feature film is over a hundred thousand.
> The source can dump all of them in a second, and the decoder will get to them eventually.
> Meanwhile the memory holds the entire movie, waiting.

> It gets worse one step down. The decoder outputs raw frames, hundreds of kilobytes each at low
> resolution, megabytes at HD. If the encoder is slower than the decoder, raw frames pile up.
> That's gigabytes in seconds, and the machine goes down.

> This isn't a bug in any element. It's what happens when the fastest element sets the pace.
> The slowest one should.

**[1:40] Backpressure. Reverse the arrow in the animation.**

> The fix has a name: backpressure. Instead of the producer pushing whenever it has something, the
> consumer tells the producer how much it can take. The pressure flows backward, from the end of the
> pipeline to the start. The encoder says "I can take five frames". The decoder decodes five, then
> stops and asks the source for more input. The source reads just that much. Everything runs at the
> encoder's speed, with a few buffers in flight. Memory stays flat.

> In Membrane the consumer's request is called a demand. And a Realtimer in front of a player,
> episode seven, is exactly this: the Realtimer demands slowly, so everything upstream runs slowly,
> and the file source ends up reading at 25 frames a second without knowing why.

**[2:30] Three modes. Slide "Three flow control modes".**

> You configure this per pad, with the `flow_control` option on `def_input_pad` and
> `def_output_pad`. Three values.

> `:auto`. The default. The framework computes the demand for you, from what the neighbours ask for
> and how fast the element itself is keeping up. You implement `handle_buffer` and nothing else,
> and a whole chain of auto elements adapts to the slowest one. Most elements live here.

> `:push`. No backpressure at all. An output in push mode sends whenever it wants; an input in push
> mode has to cope with whatever arrives. That sounds like the problem we just described, and it
> is, but sometimes the pace really is set outside your process. A source receiving packets from
> the network can't ask the network to slow down. The packets come. Push describes reality.

> `:manual`. Pull mode. Nothing arrives on a manual input until the element asks for it, with a
> `demand` action. And when something downstream wants data from a manual output, the element gets
> a `handle_demand` callback and has to satisfy it by hand. Full control over which pad to read
> from, how much, and when. At the price of writing it.

> From the code's point of view, auto and push are nearly interchangeable: take an element written
> for one, flip the option, and it more or less still works. Manual is a different programming model.

**[3:50] Manual, the minimal example. Slide "Manual flow control".**

```elixir
defmodule PassThrough do
  use Membrane.Filter

  def_input_pad :input, accepted_format: _any, flow_control: :manual, demand_unit: :buffers
  def_output_pad :output, accepted_format: _any, flow_control: :manual, demand_unit: :buffers

  @impl true
  def handle_demand(:output, size, :buffers, _ctx, state) do
    {[demand: {:input, size}], state}
  end

  @impl true
  def handle_buffer(:input, buffer, _ctx, state) do
    {[buffer: {:output, buffer}], state}
  end
end
```

> The simplest manual filter. Both pads manual, demand counted in buffers. Downstream asks for
> `size` buffers; we ask upstream for the same. Each buffer that arrives goes straight out. When
> downstream wants more, `handle_demand` fires again. The happy path: `handle_demand` with twenty,
> we demand twenty on the input, `handle_buffer` runs twenty times, repeat.

> In a source, `handle_demand` is where you'd read from the outside world, a file, a socket. In a
> filter you usually just pass the demand upstream, like here.

**[4:35] Two rules. The demand table.**

> Two rules that will save you an afternoon. One: a `demand` on an input pad *replaces* the current
> demand, it doesn't add to it. Demand five, receive three, you're at two. Demand five again, you're
> at five, not seven. Two: you won't receive more than you demanded. Demand N buffers and
> `handle_buffer` runs at most N times, unless the stream ends first. That precision is the point.

**[5:00] Redemand. The drop-every-other snippet.**

> The flip side: you're expected to satisfy the whole demand on your output. If you can't, because
> you dropped a buffer, return `redemand: :output`. That calls `handle_demand` again with whatever is
> still owed, and your demand logic stays in one place.

```elixir
@impl true
def handle_buffer(:input, buffer, _ctx, %{counter: counter} = state) do
  actions =
    if rem(counter, 2) == 0,
      do: [buffer: {:output, buffer}],
      else: [redemand: :output]

  {actions, %{state | counter: counter + 1}}
end
```

> A filter that drops every second buffer. When it forwards one, the demand is satisfied by one.
> When it drops one, it owes downstream a buffer it isn't going to produce from this input, so it
> says: ask me again. Here you could skip the redemand and demand twice the size upfront, you know
> the ratio. Usually you don't know how many input buffers make one output buffer, and then it's
> more natural to demand what you were asked for and let redemand handle the rest.

> Remember the symptom. Forget the redemand and the pipeline doesn't crash. It stops. No error, no
> log. Everybody is politely waiting for someone to ask.

**[5:50] Units, one sentence.**

> One detail: demand has a unit, `demand_unit`, buffers or bytes. An audio sink may count in bytes
> while your filter counts in buffers. That's fine; Membrane converts between units on the link.

**[6:05] The toilet, briefly.**

> Last piece, because you'll meet it in the episode on live streams. What happens where a push
> output meets a pull input? The pushing side doesn't listen to demands. So Membrane puts a queue
> between them, bounded, two hundred buffers by default. If it overflows, the pipeline crashes, on
> purpose, with a message naming the pad. The alternative is the unbounded mailbox from the start of
> this episode, and a crash with a clear message beats a machine with no memory. The queue has a
> name in the error message. It's called the toilet.

**[6:35] Takeaway + next**

> The slowest element sets the pace. Backpressure is how it tells the others. Auto for almost
> everything, push when the world sets the pace, manual when you need to decide yourself which
> input to read from. Next episode we read a real element that needs exactly that: two inputs, one
> output, and the ability to pause one input without touching it.

**[6:55] End**

---

## Version B (room for you)

**Hook, pick one:**

1. "Where does the difference go?" On camera, no slide.
2. A failure clip: a pipeline without backpressure, `observer` or `top` with memory climbing.
   Risky to record, but if you have one ready it's the best hook. `[YOU: do you have one?]`
3. `[YOU: your OOM / million-message-mailbox story. Everyone who has run BEAM in production
   has one.]`

**Beats:**

1. Unbounded mailbox + fast producer = memory grows. The raw-frames example (gigabytes in seconds).
2. The slowest should set the pace. Backpressure = pressure flows backward. Demand.
3. Callback to the Realtimer from episode 07: "the file source reads at 25 fps without knowing why".
4. Three modes. One sentence of "when" each. `:push` = "describes reality". `[YOU: an opinion on
   when people reach for manual unnecessarily?]`
5. PassThrough: `handle_demand` → demand upstream. Source vs filter in `handle_demand`.
6. Two rules: demand overwrites (the table); never more than demanded.
7. Redemand with "drop every other buffer". **Symptom: stops, not crashes.** `[YOU: how many times
   have you debugged a "hung" pipeline that was just waiting for a redemand?]`
8. Units, one sentence.
9. Toilet: push → pull, 200 buffers, deliberate crash. The name as the punchline.
10. Next: a real element with two inputs.

**What not to do:** don't go into how `:auto` computes demand under the hood. Don't explain
timestamp-based demand (`membrane_core` 1.3) beyond a half-sentence if at all. Don't compare with
Reactive Streams, Akka or GenStage for more than one sentence, unless `[YOU: you have an opinion
on that]`. Don't present any snippet as something the viewer should go and type.
