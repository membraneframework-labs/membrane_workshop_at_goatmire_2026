Mix.install([
  {:membrane_core, "~> 1.3"},
  {:membrane_file_plugin, "~> 0.17.4"},
  {:membrane_transcoder_plugin, "~> 0.5.0"},
  {:membrane_mp4_plugin, "~> 0.36.9"}
])

Logger.configure(level: :error)

defmodule Mp3ToMp4 do
  use Membrane.Pipeline

  @impl true
  def handle_init(_ctx, _opts) do
    spec =
      child(:source, %Membrane.File.Source{
        location: "input.mp3",
        content_format: Membrane.MPEGAudio
      })
      |> child(:transcoder, Membrane.Transcoder)
      |> via_out(:output,
        options: [output_stream_format:
          %Membrane.Transcoder.OutputFormat.AAC{config: :esds}
        ]
      )
      |> child(:muxer, Membrane.MP4.Muxer.ISOM)
      |> child(:sink, %Membrane.File.Sink{
        location: "output.mp4"
      })

    {[spec: spec], %{}}
  end

  @impl true
  def handle_element_end_of_stream(:sink, _pad, _ctx, state) do
    {[terminate: :normal], state}
  end

  @impl true
  def handle_element_end_of_stream(_child, _pad, _ctx, state) do
    {[], state}
  end
end

{:ok, _supervisor, pipeline} = Membrane.Pipeline.start_link(Mp3ToMp4)
ref = Process.monitor(pipeline)

receive do
  {:DOWN, ^ref, :process, _pid, _reason} -> :ok
end
