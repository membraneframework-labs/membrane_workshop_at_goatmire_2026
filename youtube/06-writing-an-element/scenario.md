# 06 · Anatomy of a Membrane element: pads, callbacks, buffers

| | |
|---|---|
| Type | MEMBRANE |
| Length | 6-7 min |
| SEO title | "How to write a custom video filter in Elixir: Membrane elements, pads and buffers explained (Multimedia 101 #6)" |
| Keywords | membrane custom element, elixir video filter, membrane filter handle_buffer, membrane pads accepted_format, invert video colors elixir |
| Source | Ch. 2 slides "Defining own Elements", "Pads specification", "Buffers and handle_buffer", DEEP_DIVE Ch. 2 "Creating elements", Ch. 2 BONUS (callback context) |
| On screen | The `ColorInverter` module, revealed in two parts: pads, then the callback. A short animation: stream format travels first, then buffers. The "split the Transcoder" diagram from the slides. Optional clip: two `ffplay` windows side by side, original and negative. |

## Facts that must land

- An element is a module with `use Membrane.Filter` (or `Membrane.Source` / `Membrane.Sink`). Two things to define: pads and callbacks.
- `def_input_pad` / `def_output_pad` with `accepted_format` is a contract. Linking incompatible pads fails, at link time, naming the pad.
- Before any buffer flows, the stream format travels down the pad, for raw video `%Membrane.RawVideo{width, height, pixel_format, framerate}`. That's how downstream knows how to read the payloads.
- A stream is a sequence of `Membrane.Buffer`s: `payload` (the bytes, here one frame), `pts`, `dts`, `metadata`. A callback returns `{actions, state}`.
- `handle_buffer/4` runs once per buffer on an input pad. Returning `buffer: {:output, buffer}` sends it on. Changing only the payload keeps the timestamps.
- The callback context carries the current stream format of each pad: `ctx.pads[:input].stream_format` gives width and height.
- A filter like this sits between a decoder outputting raw RGB and an encoder, because raw media is the only place you can touch pixels.
- `flow_control: :auto` in the pad definition is the default; episode 8 explains it.
- Per-pixel work in Elixir is fine for small frames. Heavy work goes native; Membrane's own decoders and encoders wrap native libraries.

---

## Version A (detailed)

**[0:00] Cold open. Two `ffplay` windows side by side: the original and its negative. Silence for two seconds.**

> Same video, twice. The one on the right went through one extra element on the way, and that
> element is about twenty lines of Elixir. Let's read them.

**[0:10] Bumper**

**[0:15] On camera**

> Episode five: a frame is a flat binary, and inverting its colors means subtracting every byte
> from 255. This episode turns that into a Membrane element, and on the way you'll see the three
> things every element has: pads, callbacks, and buffers. Once you've read one element, you can
> read any of them.

**[0:35] An element is a module. Slide "Defining own Elements".**

> An element is a module that implements the behaviour of its kind: `use Membrane.Source`,
> `use Membrane.Sink`, or, here, `use Membrane.Filter`. Then there are exactly two things to
> define. Pads, which are how the element connects to its neighbours. And callbacks, which are
> what it does when something happens.

**[0:55] Pads. Slide "Pads specification".**

```elixir
defmodule ColorInverter do
  use Membrane.Filter

  def_input_pad :input,
    accepted_format: %Membrane.RawVideo{pixel_format: :RGB}

  def_output_pad :output,
    accepted_format: %Membrane.RawVideo{pixel_format: :RGB}
```

> One input, one output, both raw video in RGB. `accepted_format` is a pattern. It's a contract:
> this element only works between something that produces RGB frames and something that consumes
> them. Try to link an H.264 output into it and Membrane refuses, at link time, naming the pad.
> I'd rather have that than a filter that silently inverts compressed bytes.

> There's one more option you'll see in generated code, `flow_control: :auto`. It's the default
> and it's about pacing; episode eight is all about it. For now, ignore it.

**[1:40] The stream format. Short animation: a format struct travels down the pad, then buffers follow.**

> How does an element know what the bytes it receives mean? Episode five: a frame is noise
> without resolution and pixel format. So they travel with the stream. Before the first buffer,
> the upstream element sends a stream format down the pad. For raw video it's this struct:

```elixir
%Membrane.RawVideo{width: 480, height: 270, pixel_format: :RGB, framerate: {25, 1}}
```

> Membrane checks it against our `accepted_format`. Then every element downstream knows how to
> read the payloads that follow. Our filter doesn't change the format, so by default it's passed
> on as is.

**[2:10] Buffers and the callback. Slide "Buffers and handle_buffer".**

> Now behaviour. A stream is a sequence of buffers. `Membrane.Buffer` has a `payload`, that's the
> frame, exactly the binary from episode five. It also has `pts` and `dts`, the timestamps, and a
> `metadata` map. The callback that runs for each buffer arriving on an input pad is
> `handle_buffer`:

```elixir
  @impl true
  def handle_buffer(:input, %Membrane.Buffer{} = buffer, _ctx, state) do
    inverted = for <<byte <- buffer.payload>>, into: <<>>, do: <<255 - byte>>
    buffer = %Membrane.Buffer{buffer | payload: inverted}

    {[buffer: {:output, buffer}], state}
  end
end
```

> Four arguments: the pad the buffer came in on, the buffer itself, a context we'll use in a
> minute, and the element's state. Every callback returns the same shape: a list of actions and
> the new state. Here the work is one binary comprehension, every byte subtracted from 255. We put
> the result back into the *same* buffer, so the timestamps survive untouched. And we return one
> action: send this buffer out on `:output`. That's the whole element. Two pads, one callback.

**[3:10] Where it sits. Slide "split the Transcoder" diagram.**

> Where does a thing like this go in a pipeline? Between a decoder and an encoder. Episode one:
> raw media in the middle of a transcoding chain is the only place you can touch pixels. A
> decoder that outputs RGB raw video matches our input pad. Our output is RGB, which an encoder
> accepts. The chain type-checks, if you want to think of it that way.

```elixir
|> child(:decoder, Membrane.Transcoder)
|> via_out(:output,
  options: [output_stream_format: %Membrane.Transcoder.OutputFormat.RawVideo{pixel_format: :RGB}]
)
|> child(:color_inverter, ColorInverter)
|> child(:encoder, Membrane.Transcoder)
|> via_out(:output,
  options: [output_stream_format: %Membrane.Transcoder.OutputFormat.H264{}]
)
```

> Decode to RGB, invert, encode to H.264. That's the pipeline behind the two windows from the
> start.

**[3:50] The callback context.**

> One more thing, because it shows what the context argument is for. Say you want to invert only
> the bottom half of each frame. Now you need the resolution. The context holds, among other
> things, the current stream format of each pad:

```elixir
  @impl true
  def handle_buffer(:input, buffer, ctx, state) do
    %{width: width, height: height} = ctx.pads[:input].stream_format
    top_size = width * div(height, 2) * 3

    <<top::binary-size(top_size), bottom::binary>> = buffer.payload
    inverted = for <<byte <- bottom>>, into: <<>>, do: <<255 - byte>>

    {[buffer: {:output, %{buffer | payload: top <> inverted}}], state}
  end
```

> The frame is row-major, so the top half is the first `width × height / 2 × 3` bytes. Pattern
> match the binary in two, invert the second part, glue them back together. That's the address
> formula from episode five doing real work, and it's why Elixir binaries are such a comfortable
> fit for this: slicing a frame is a pattern match.

**[4:40] An honest note on performance.**

> A fair question: is Elixir fast enough to do this per pixel? For a small frame, 480 by 270, yes,
> easily. For 4K at 60 frames a second, you wouldn't do pixel math in BEAM code. You'd write a NIF,
> or use an element that wraps a native library, which is how Membrane's own decoders and encoders
> work. The point of this episode isn't the pixels. It's the shape: pads, a callback, buffers in,
> buffers out. That shape is the same whether the work inside is Elixir or C.

**[5:10] Takeaway + next**

> An element is pads plus callbacks. The stream format tells everyone what the bytes mean, the
> buffer carries them, and a callback returns actions and a new state. Next episode: timestamps.
> Why a frame has two of them, and why a video played straight from a file runs at a thousand
> frames per second unless something stops it.

**[5:30] End**

---

## Version B (room for you)

**Hook, pick one:**

1. Two `ffplay` windows side by side. "Twenty lines."
2. `[YOU: the first element you wrote. What did it do, and what went wrong?]`
3. A question: "What's the smallest possible video effect?" Answer: one subtraction, and an
   element to put it in.

**Beats:**

1. Element = module with `use Membrane.Filter`. Two things to define: pads, callbacks.
2. Pads with `accepted_format`. **A contract, checked at link time, naming the pad.** `[YOU: a story
   about a format mismatch caught early, or caught far too late?]` `flow_control: :auto` → "default,
   episode eight".
3. Stream format travels first, `%Membrane.RawVideo{}`. Then buffers.
4. `handle_buffer`: payload → invert → the same buffer → `buffer` action. Why the same buffer:
   timestamps. Callback returns `{actions, state}`.
5. Where it sits: decoder (RGB) → filter → encoder. "Raw in the middle is where you work."
6. The context: bottom half only, `ctx.pads[:input].stream_format`, binary pattern match.
   `[YOU: why binaries make Elixir pleasant for media: sub-binaries without copying, matching on
   headers…]`
7. Performance, honestly. BEAM for the model, native for the pixels. `[YOU: where's the line for
   you? What does Membrane do natively and what in Elixir?]`
8. Next: timestamps ("a thousand frames per second").

**What not to do:** don't explain demand or flow control, even though `flow_control: :auto` is on
screen. Don't show `handle_init` for more than a second. Don't list every element callback; one
is enough to show the pattern.
