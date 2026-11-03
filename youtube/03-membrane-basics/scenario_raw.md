# 03 · Media processing is a graph: elements, pads and pipelines

Think about what a video player has to do when you want to play a movie. It reads the file, or a stream from the network, and splits it into a video track and an audio track. Then it decodes each track, which means unpacking the compressed media back into pictures and sound. After that it puts these pictures on the screen and sends the sound to the speakers. And none of those steps needs to know how the others work inside. The decoder doesn't care whether the bytes came from a file or from the network, and the screen doesn't care how the video was compressed. Each step cares only about what comes in and what goes out, and that's why you can draw this kind of software as boxes and arrows. Membrane, the framework this series is about, is built around that idea, and the code you write looks very much like this.

In this video I'll explain how software that processes media streams is usually structured: as a graph of small steps that the media flows through. Then I'll show how that graph looks in Membrane. We'll see what a Membrane element is, what a pad is, where elements come from, and how a complete pipeline is written.

But first, in case you don't know Membrane yet, a few words about what it is. Membrane is an open-source framework for building this kind of software in Elixir. It's a library you add to your project. You describe the graph, and Membrane runs it. You say which steps there are and how they connect. Membrane starts every step, moves the data between them and tells you when something happens, like the end of a stream. Its advantage is that you can build a pipeline customised exactly to your needs. That matters in non-standard cases, where fiddling with the flags of a ready-made tool like FFmpeg isn't enough anymore.

Now, back to the player. None of those boxes ever holds the whole movie at once. The data goes through in small chunks, one after another, so different boxes can be busy with different chunks at the same time.

In Membrane, that graph is called a pipeline and the boxes are called elements. Every element runs independently of the others. And because Membrane and Elixir take care of the concurrency, you don't have to implement any threading or parallelisation yourself.

There are three kinds of elements you'll meet in almost every pipeline. A source has only outputs, and it's where a stream starts. It might read a file or receive data from the network. A filter has both inputs and outputs, so it takes a stream in and gives a stream out. Decoders are filters, and so are encoders, which compress rather than unpack. Most of what you write yourself will be a filter too. And a sink has only inputs, and it's where a stream is consumed. Sinks might, for example, save the stream to a file or pass it to the speakers.

Membrane elements connect to each other through pads. A pad is a named input or output of an element. You link an output pad of one element to an input pad of another. Here it's the output of an MP3 decoder going into the input of an audio sink. Pads also declare the format of the stream they accept, and two linked pads have to agree on that format. If they don't, the pipeline fails the moment the stream is about to flow through that link.

Where do Membrane elements come from? The framework itself is one package, called membrane core. It knows how to run pipelines, elements and pads, and nothing about any particular media format. Almost all elements live in separate packages called plugins, usually one per domain. There's a file plugin with a file source and a file sink, and an MP4 plugin with a muxer and a demuxer. There's an H.264 plugin, a WebRTC plugin, and so on. You add the ones you need to your project, and you can write your own.

Let's look at a complete pipeline. This one plays an MP3 file through your speakers. An MP3 file holds just one audio track, so there is nothing to split, and three elements are enough. The file source reads the file and sends the bytes on. The MP3 decoder turns the compressed audio into raw samples, the plain numbers a sound card can play. And the audio sink hands those samples to the sound card, so we have a source, a filter and a sink.

Now let's look at how it's written. A pipeline is an Elixir module that implements a few callbacks. The framework talks to your module by calling those callbacks, and your module answers by returning actions. Actions are simply instructions for the framework.

Our module starts with "use Membrane.Pipeline", which makes it a pipeline. The first callback is handle init, and Membrane calls it once, when the pipeline starts. Inside it we describe the processing graph. "child" adds one element to the pipeline's graph. The first line adds the file source and tells it which file to read. The pipe operator links two elements, so that one of them can pass a media stream to the other. This way, the second line adds the decoder, linked to the source, and the third one adds the audio sink, linked to the decoder.

Each Membrane callback returns two things. The first is a list of actions. In the case of handle init, that list holds one action, spec, with the graph we just described. When the framework gets it, it starts the three elements, links their pads, and the audio starts to flow.

The second thing the callback returns is the state of the pipeline. We don't need any in this case, so it will just be an empty map.

One more thing is needed, because the pipeline doesn't know on its own when the job is done. When the file source reaches the end of the file, it sends an end-of-stream signal down the chain. Membrane calls this callback every time one of the elements receives it. We only care about the sink, because when the end of stream gets there, it means that all the elements we spawned are done with their processing. So for the sink we return the terminate action, which shuts the pipeline down cleanly. For any other element we return no actions at all.

And the last line starts it: you call start link with the module.

So, media processing can be represented as a graph of small steps, and in Membrane that graph is a pipeline of elements, each doing one thing to the stream. They are linked through pads, and they come from plugins. You describe the graph, and Membrane runs it.

Thank you for watching, and see you in the next episode.
