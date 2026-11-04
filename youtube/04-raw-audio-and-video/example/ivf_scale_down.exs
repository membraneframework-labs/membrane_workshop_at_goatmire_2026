Mix.install([
  {:membrane_core, "~> 1.3"},
  {:membrane_file_plugin, "~> 0.17.4"},
  {:membrane_ivf_plugin, "~> 0.9.0"},
  {:membrane_transcoder_plugin, "~> 0.5.0"},
  {:membrane_ffmpeg_swscale_plugin, "~> 0.16.5"},
  {:membrane_mp4_plugin, "~> 0.36.9"}
])

Logger.configure(level: :error)

defmodule ScaleDown do
  use Membrane.Pipeline

  @impl true
  def handle_init(_ctx, _opts) do
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

    {[spec: spec], %{}}
  end

  @impl true
  def handle_element_end_of_stream(:file_sink, _pad, _ctx, state) do
    {[terminate: :normal], state}
  end

  @impl true
  def handle_element_end_of_stream(_child, _pad, _ctx, state) do
    {[], state}
  end
end

{:ok, _supervisor, pipeline} = Membrane.Pipeline.start_link(ScaleDown)
ref = Process.monitor(pipeline)

receive do
  {:DOWN, ^ref, :process, ^pipeline, _reason} -> :ok
end
