# 04 · What raw audio and video look like in memory

This is a video frame, not a JPEG or a PNG but the frame itself, the way a decoder hands it over. A decoder is the program that turns compressed video back into pictures, and what it gives you is a couple of hundred thousand bytes like these. If I give you only this, you can't draw it, because nothing in here says how wide the picture is or what the bytes mean. [stiff, the whole paragraph. rephrase it or drop it at all]

In this video I'll explain what raw video and audio are and what they look like in memory. I will go over topics like resolution, pixel formats, sample rate and channels. At the end I'll show you how to get at that raw data in Membrane, an open-source multimedia framework for Elixir.

Let's start with video. A raw video stream is a series of pictures called frames, and each frame is one flat block of bytes, the pixels one after another. They are laid out row by row from the top, left to right. So the first thing you need to know about a frame is its resolution, the width and height in pixels. The width tells you where one row ends and the next one begins. With that, you can find any pixel: skip the rows above it, then move along its row to its column.

The second thing you need is the pixel format, which says how many bytes a pixel takes and what they mean. The best-known one is RGB: three bytes per pixel. One byte for red, one for green and one for blue. Each of them from zero to two hundred fifty-five. Here is a small, two by two frame. It is represented by twelve bytes, three per pixel.

But that's not what a video decoder usually gives you. Decoders mostly hand you one of a family of formats called YUV. YUV uses the fact that your eye sees fine detail much better in brightness than in colour. So we can keep brightness for every single pixel, while keeping the same colour for a batch of them, like a square two by two. The most common YUV version is I420. It splits the frame into three parts called planes: first all the brightness bytes, then the two colour planes, each a quarter of the brightness plane. On average that's one and a half bytes per pixel instead of three, so half the memory for the same picture, before any compression is involved.

Now let's explain the raw audio. Sound is a wave, and raw audio is that wave measured at regular intervals. Each measurement is called a sample, and it's just a number: how far the wave is from the middle at that moment. How often you measure is the sample rate, typically forty-four thousand one hundred times a second.

Then you need the sample format: how big each number is and how to read it. Most of the time that's sixteen-bit integers. It means two bytes per sample.

Another thing you need to read raw audio, is the number of channels. Stereo has two, left and right, and in memory they are usually interleaved: one sample for the left, one for the right, and so on. So one second of stereo with two channels takes 2 times more space, than one second of mono audio. With 2 bytes per sample and a standard sampling rate, it takes almost 2 megabytes. That is far less than video, but still about ten times what one second of MP3 takes.

And this is what video and audio have in common. Raw data doesn't describe itself. A raw frame has no embedded metadata, and neither does a block of samples. The bytes don't say how wide the picture is, whether it's RGB or I420, or how many channels the audio has. You need these information if you want to understand or process it in any way. In case of raw media, all of that has to travel next to bytes representing pixels or samples.

So how does this look in Membrane?  In Membrane, you describe media processing as a graph of elements, called a pipeline, where each element does one thing with the stream and passes it on. (BTW, if you still don't know what Membrane is, check out this: ___) Before any data goes from one element to the next, the element sends a thing we call a stream format. Stream format describes the stream, that will be sent or received via a Membrane Pad. For raw video, it contains the width, the height and the pixel format. For raw audio, it provides the sample rate, the sample format and the number of channels. Then the data follows, so the element that receives the stream knows how to read it.

In a Membrane pipeline you often don't see the raw data at all. The Transcoder, a Membrane component that converts media from one format to another, decodes and compresses again inside itself, so the raw frames never leave it. But raw data is where you can do something with the media. Here is a pipeline that decodes a video compressed with VP8, a video compression format, and shrinks every frame to a third of its width and height. That's useful when you run an AI model on the frames and want to save computing power, or when you send the stream over a poor network. We use the Transcoder twice here, once to decode and once to encode.

Let's look at how it's written. The first element reads the video file. The video sits in a simple container called IVF, a file format that wraps the stream. The IVF deserializer pulls the compressed VP8 stream out of it. Then comes the first Transcoder, and instead of a compressed format we ask it for raw video in I420.

Now we have raw frames. The next element is the scaler. It takes every frame and gives back a frame of a hundred and sixty by ninety pixels. It also sends a new stream format down the line, with the new width and height. Storing raw frames would take too much space, so a second Transcoder compresses them again, this time as H.264, another compression format. A muxer packs that stream into an MP4 container. And a file sink writes it to disk.

When this pipeline is done, we have an MP4 that a normal video player opens. ffprobe, a tool that prints what a file says about itself, shows the compression format and the resolution, because the container carries them. If we had written the raw frames to a file instead, no player could open it without being told the pixel format, the resolution and the frame rate.

So, a raw frame is a flat block of pixels, read with a resolution and a pixel format. Raw audio is a series of samples, read with a sample rate, a sample format and the number of channels. Raw data doesn't describe itself. The description travels alongside it, and in Membrane that's the stream format.

Thank you for watching, and see you in the next episode.
