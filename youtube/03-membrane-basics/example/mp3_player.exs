Mix.install([
  {:membrane_core, "~> 1.3"},
  {:membrane_file_plugin, "~> 0.17.4"},
  {:membrane_mp3_mad_plugin, "~> 0.18.7"},
  {:membrane_portaudio_plugin, "~> 0.19.6"}
])

Logger.configure(level: :error)

defmodule Mp3Player do
  use Membrane.Pipeline

  @impl true
  def handle_init(_ctx, _opts) do
    spec =
      child(:source, %Membrane.File.Source{location: "input.mp3"})
      |> child(:decoder, Membrane.MP3.MAD.Decoder)
      |> child(:sink, Membrane.PortAudio.Sink)

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

{:ok, _supervisor, pipeline} = Membrane.Pipeline.start_link(Mp3Player)
ref = Process.monitor(pipeline)

receive do
  {:DOWN, ^ref, :process, _pid, _reason} -> :ok
end
