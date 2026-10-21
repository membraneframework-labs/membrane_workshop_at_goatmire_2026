# 02 · MP4 is not a codec: containers, muxing and demuxing

Here is what a tool called ffprobe says about an MP4 file. Stream zero is video, encoded with H.264. Stream one is audio, encoded with AAC. There is no "MP4 compression" anywhere in here. So if MP4 doesn't compress anything, what does it actually do? That's what this episode is about.

In this video I'll explain what a multimedia container is, why MP4 is not a codec, and what muxing and demuxing mean. At the end I'll show you how all of this looks in Membrane, an open-source multimedia framework for Elixir.

Let's start with what comes out of an encoder, the program that compresses video or audio. It gives you a stream of bytes, and if I just hand you that stream, you'll run into a few problems. Where does one frame end and the next one begin? When should each frame be shown? And if I also give you the audio, how do you know which bit of audio goes with which video frame?

A container answers those questions. It wraps the encoded streams with the information a reader needs: where each frame starts, what its timestamp is, and which track it belongs to. Tracks are simply the streams inside the container: video, audio, maybe subtitles.

So these are two separate questions. The codec is how the media is compressed. The container is how the streams are packaged. You can have H.264 in MP4, H.264 in MKV, VP8 in WebM, any combination the container allows. And when somebody asks you to "convert this to MP4", it's worth asking which part they mean: repackaging is quick, re-encoding is not.

Let's look at three examples. MP4 is the container you meet everywhere. It can hold many tracks, you can jump to any point in the file, and almost every device can play it. It's an ISO standard, which is why you'll see "ISOM" in library names.

IVF is the opposite, about as simple as a container gets. It holds a single video stream. The whole container is a 32-byte header at the start of the file, and then 12 bytes in front of every frame. Those 12 bytes say how big the frame is and when to show it. Here are the first bytes of such a file: the 32-byte header, then the 12 bytes for the first frame, and then the frame itself begins. All of that together is less than one percent of the file.

And MP3 doesn't need a container at all. Every MP3 frame starts with its own small header that says what kind of frame it is, and from that you know how many bytes it takes. So the encoded stream can go straight into a file. That's why MP3 is the name of both the codec and the file format.

Putting streams into a container is called muxing. The muxer takes the H.264 stream and the AAC stream and interleaves them. So you get a chunk of video, then the matching chunk of audio, then the next chunk of video, and so on. Each piece gets its timestamp, so a player can read the file from the beginning and keep both in sync. The muxer doesn't compress anything. In the MP4 file we started with, the container is about half a percent of the size. The rest is the encoded media itself.

Demuxing is the reverse, and it's the first thing a media player does with a file like this. It reads the part of the file that says where every frame is, splits the file back into the separate streams, and hands each one to its decoder, the program that turns it back into pictures or sound. After the demuxer you still have H.264 and AAC, not pictures and sound.

There's one more thing containers do, and you'll run into it the first time you try to put H.264 into an MP4 yourself. Some codecs need a few settings before the decoder can start. For H.264 those are the parameter sets, which describe the resolution and the encoding options. They can travel inside the stream, in front of the frames, or sit once in the container header, which is what MP4 normally does. So the same H.264 comes in two shapes, and a muxer insists on the shape it was designed for.

Here is the ffprobe output from the beginning again. Next to "h264" it says "avc1". That's the name of the box in the MP4 header where this configuration lives. The audio line has "mp4a" in the same spot, and inside that box the AAC configuration sits in another one called "esds".

So how does this look in Membrane? In Membrane, you build a media application as a pipeline: a chain of elements, where each element does one thing with the stream and passes it on. Here is a pipeline that takes a VP8 video in an IVF file and an MP3 file, and produces one MP4 with H.264 and AAC inside. Every box does one job, and two of them are about containers: the IVF deserializer and the MP4 muxer.

The IVF deserializer unpacks the VP8 stream from the IVF file, so it's a demuxer for a one-track container. The MP4 muxer puts the AAC and the H.264 together into one MP4.

Now let's look at how this pipeline is written. Don't worry about the syntax itself, that's a topic for another episode. The first element reads the IVF file. The second one, the IVF deserializer, takes the container apart and gives us the plain VP8 stream. Then a Transcoder, a component that re-encodes the stream, turns VP8 into H.264. Notice the option: stream structure avc1. That's the shape the MP4 muxer wants, with the parameter sets kept aside for the header. Then comes the MP4 muxer, ISOM as in the ISO standard, and a file sink that writes the result to disk.

The second branch starts with the MP3 file, and this is the no-container case in practice. There's no container header to announce the format, and the file source doesn't look inside the bytes, so we tell it ourselves: the content format is MPEG audio. Then a Transcoder turns MP3 into AAC, with config esds, again the shape the muxer wants. And the last line plugs this branch into the same muxer as the video.

So, the codec is how the media is compressed, and the container is how the streams are packaged. A muxer puts streams into a container, a demuxer takes them out, and neither of them touches the compression. That's the core of what containers do, and it's enough to read a pipeline like the one we just saw. Thanks for watching, and see you in the next episode.
