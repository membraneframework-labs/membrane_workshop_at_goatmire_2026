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

So how does this look in Membrane?  In Membrane, you describe media processing as a graph of elements, called a pipeline, where each element does one thing with the stream and passes it on. (BTW, if you still don't know what Membrane is, check out this: ___) Before any data goes from one element to the next, the element sends a thing we call a stream format. Stream format describes the stream, that will be sent or received via a Membrane Pad. For raw video, it contains the width, the height and the pixel format. For raw audio, ir provides the sample rate, the sample format and the number of channels. Then the data follows, so element that receives the stream knows how to read it.

Many times you will not see the raw data at all, because the Transcoder, a component that converts media from one compressed format to another, decodes and encodes the stream inside itself. But you can ask it for raw output instead. Here is a pipeline that decodes a video compressed with VP8 and an MP3 file, and writes the raw bytes of both to files.

Don't worry about the syntax, that's a topic for another episode. The first element reads the video file. The video sits in a simple container called IVF, a file format that wraps the stream, so the IVF deserializer unpacks the plain VP8 stream from it. Then comes the Transcoder, and instead of a compressed format we ask it for raw video in I420, which is what the decoder inside it produces anyway. And a file sink writes whatever comes out to disk, so this file is nothing but frames, one after another.

The second branch reads the MP3, and tells the source what's inside, because MP3 has no container to say so. Then a Transcoder again, asked for raw audio. Here we spell out every field, sixteen-bit samples, forty-four thousand one hundred per second, two channels, so the file comes out exactly in the format we asked for. And a file sink writes the samples to a second file.

When this pipeline is done, the video file is a hundred and fifty-eight megabytes for half a minute of video. The VP8 file we started with is one megabyte, and the audio comes to almost six megabytes against half a megabyte of MP3. And to play the video file with a player like ffplay, we have to tell it everything the file doesn't say. That it's raw video, the pixel format, which ffplay calls yuv420p, the resolution, and the frame rate, and then it plays. The same for the audio: the sample format, the rate and the channels. Membrane itself takes the frame rate from timestamps, a topic for another episode.

So, a raw frame is a flat block of pixels, read with a resolution and a pixel format. Raw audio is a run of samples, read with a sample rate, a sample format and the number of channels. Raw data doesn't describe itself. The description travels alongside it, and in Membrane that's the stream format.

Thank you for watching, and see you in the next episode.
