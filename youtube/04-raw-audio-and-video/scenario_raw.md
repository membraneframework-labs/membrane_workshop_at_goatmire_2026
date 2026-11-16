# 04 · What raw audio and video look like in memory

These bytes are a video frame, exactly the way a decoder hands it over. If all you had were these bytes, you couldn't draw the picture, because nothing here says how these bytes map to pixels, or how wide and high each frame is.

In this video I'll explain what raw video and audio are and what they look like in memory. I will go over topics like resolution, pixel formats, sample rate and channels. At the end I'll show you how to handle raw data in Membrane, an open-source multimedia framework for Elixir.

Let's start with video. A raw video stream is a series of pictures called frames, and each frame is one flat block of bytes, the pixels one after another. Pixels are laid out row by row from the top, left to right. To know where each row starts and ends, you need to know the frame's resolution. That means its width and height in pixels.

Another thing you need to know about a frame is the pixel format, which says how many bytes a pixel takes and what they mean. The best-known one is RGB. In RGB we usually have three bytes per pixel. One byte for red, one for green and one for blue. Each of them goes from zero to two hundred and fifty-five. Here is a small frame, two by two pixels. It is represented by twelve bytes, three per pixel.

But that's not what a video decoder usually gives you. Decoders mostly hand you one of a family of formats called YUV. YUV uses the fact that your eye sees differences in birgthness much to a greater extend than differences in colours. So we can keep the brightness of every single pixel, while keeping one colour for a small group of them, for example a two by two square. The most common YUV layout is I420. It splits the frame into three parts called planes: first all the brightness bytes, then the two colour planes, each a quarter of the brightness plane. On average that's one and a half bytes per pixel instead of three, so half the memory for the same picture, before any more complex compression is involved.

Now let's look at raw audio. Sound is a wave, and raw audio is that wave measured at regular intervals. Each measurement is called a sample, and it's just a number: how far the wave is from the middle at that moment. How often you measure is the sample rate, for example forty-eight thousand times a second.

Then you need the sample format: how big each sample is and how to read it. For instance, that's sixteen-bit little-endian integers. That means two bytes per sample.

Another thing you need to know to read raw audio is the number of channels. Stereo has two, left and right, and in memory they are usually interleaved: one sample for the left, one for the right, and so on. So one second of stereo takes twice the space of one second of mono. With two bytes per sample and the most typical sample rate, it comes to about a hundred and seventy-six kilobytes. That is far less than video, but still about ten times what one second of MP3 takes.

There is one thing that video and audio have in common. Raw data doesn't describe itself. A raw frame has no embedded metadata, and neither does a block of samples. The bytes don't say how wide the picture is, whether it's RGB or I420, or how many channels the audio has. You need this information to understand or process the data in any way. And all of it has to travel alongside the bytes that hold the pixels or the samples, outside the stream itself.

So how does this look in Membrane? In Membrane, you describe media processing as a graph of elements, called a pipeline. Each element in this graph does one thing with the stream and passes it on. By the way, if you don't know Membrane yet, there's an episode about it in this series. Before any data goes from one element to the next, the element sends a thing we call a stream format. The stream format describes the stream that is about to flow from one element to the next. For raw video, it contains the width, the height and the pixel format. For raw audio, it provides the sample rate, the sample format and the number of channels. Then the data follows, so the element that receives the stream knows how to read it.

In a Membrane pipeline you often don't see the raw data at all. The Transcoder, a Membrane component that converts media from one format to another, decodes and encodes streams inside itself, so the raw frames usually don't leave it. But if you want to modify the stream in any way, there is a very big chance you will need to work on raw media. And here is a pipeline that decodes a video compressed with VP8, and converts the stream to a lower resolution. That could be useful when you run an AI model on the frames and want to save computing power, or when you send the stream over a poor network. We use the Transcoder twice here, once to decode and once to encode.

Let's take a look at how it's written. The first element reads the video file. The video sits in a simple container called IVF. The IVF deserializer pulls the compressed VP8 stream out of it. Then comes the first Transcoder, and instead of a compressed format we ask it to produce raw video.

Now we have raw frames. The next element is the scaler. It takes every frame and gives back a frame of a hundred and sixty by ninety pixels. Storing raw frames would take too much space, so a second Transcoder compresses them again, this time as H.264. A muxer packs that stream into an MP4 container and a file sink writes it to disk.

So, a raw frame is a flat block of pixels, and to read it, you need to know the resolution and the pixel format. Raw audio is a series of samples, read with a sample rate, a sample format and the number of channels. Raw data doesn't describe itself. The metadata describing it travels out of band, and in Membrane that's the stream format.

Thank you for watching, and see you in the next episode.
