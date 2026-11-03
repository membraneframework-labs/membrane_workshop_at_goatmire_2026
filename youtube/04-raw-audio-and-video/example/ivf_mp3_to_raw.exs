Mix.install([
  {:membrane_core, "~> 1.3"},
  {:membrane_file_plugin, "~> 0.17.4"},
  {:membrane_ivf_plugin, "~> 0.9.0"},
  {:membrane_transcoder_plugin, "~> 0.5.0"}
])

Logger.configure(level: :error)

defmodule IvfMp3ToRaw do
  use Membrane.Pipeline

  @impl true
  def handle_init(_ctx, _opts) do
    spec = [
      child(:ivf_file_source, %Membrane.File.Source{location: "bbb_vp8.ivf"})
      |> child(:ivf_deserializer, Membrane.IVF.Deserializer)
      |> child(:video_transcoder, Membrane.Transcoder)
      |> via_out(:output,
        options: [
          output_stream_format: %Membrane.Transcoder.OutputFormat.RawVideo{pixel_format: :I420}
        ]
      )
      |> child(:raw_video_sink, %Membrane.File.Sink{location: "video.raw"}),

      child(:mp3_file_source, %Membrane.File.Source{
        location: "bbb.mp3",
        content_format: Membrane.MPEGAudio
      })
      |> child(:audio_transcoder, Membrane.Transcoder)
      |> via_out(:output,
        options: [
          output_stream_format: %Membrane.Transcoder.OutputFormat.RawAudio{
            sample_format: :s16le,
            sample_rate: 44_100,
            channels: 2
          }
        ]
      )
      |> child(:raw_audio_sink, %Membrane.File.Sink{location: "audio.raw"})
    ]

    {[spec: spec], %{finished_sinks: 0}}
  end

  @impl true
  def handle_element_end_of_stream(sink, _pad, _ctx, state)
      when sink in [:raw_video_sink, :raw_audio_sink] do
    state = %{state | finished_sinks: state.finished_sinks + 1}

    if state.finished_sinks == 2 do
      {[terminate: :normal], state}
    else
      {[], state}
    end
  end

  @impl true
  def handle_element_end_of_stream(_child, _pad, _ctx, state) do
    {[], state}
  end
end

{:ok, _supervisor, pipeline} = Membrane.Pipeline.start_link(IvfMp3ToRaw)
ref = Process.monitor(pipeline)

receive do
  {:DOWN, ^ref, :process, _pid, _reason} -> :ok
end
