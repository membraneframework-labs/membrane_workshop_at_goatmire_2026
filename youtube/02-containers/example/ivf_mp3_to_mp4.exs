Mix.install([
  {:membrane_core, "~> 1.3"},
  {:membrane_file_plugin, "~> 0.17.4"},
  {:membrane_ivf_plugin, "~> 0.9.0"},
  {:membrane_transcoder_plugin, "~> 0.5.0"},
  {:membrane_mp4_plugin, "~> 0.36.9"}
])

Logger.configure(level: :error)

defmodule IvfMp3ToMp4 do
  use Membrane.Pipeline

  @impl true
  def handle_init(_ctx, _opts) do
    spec = [
      child(:ivf_file_source, %Membrane.File.Source{location: "bbb_vp8.ivf"})
      |> child(:ivf_deserializer, Membrane.IVF.Deserializer)
      |> child(:video_transcoder, Membrane.Transcoder)
      |> via_out(:output,
        options: [
          output_stream_format: %Membrane.Transcoder.OutputFormat.H264{stream_structure: :avc1}
        ]
      )
      |> child(:mp4_muxer, Membrane.MP4.Muxer.ISOM)
      |> child(:mp4_file_sink, %Membrane.File.Sink{location: "result.mp4"}),

      child(:mp3_file_source, %Membrane.File.Source{
        location: "bbb.mp3",
        content_format: Membrane.MPEGAudio
      })
      |> child(:audio_transcoder, Membrane.Transcoder)
      |> via_out(:output,
        options: [
          output_stream_format: %Membrane.Transcoder.OutputFormat.AAC{config: :esds}
        ]
      )
      |> get_child(:mp4_muxer)
    ]

    {[spec: spec], %{}}
  end

  @impl true
  def handle_element_end_of_stream(:mp4_file_sink, _pad, _ctx, state) do
    {[terminate: :normal], state}
  end

  @impl true
  def handle_element_end_of_stream(_child, _pad, _ctx, state) do
    {[], state}
  end
end

{:ok, _supervisor, pipeline} = Membrane.Pipeline.start_link(IvfMp3ToMp4)
ref = Process.monitor(pipeline)

receive do
  {:DOWN, ^ref, :process, _pid, _reason} -> :ok
end
