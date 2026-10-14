# 10 · WebRTC in 6 minutes: signaling, ICE, RTP

| | |
|---|---|
| Type | CONCEPT |
| Length | 5-6 min |
| SEO title | "How WebRTC works: signaling, SDP, ICE and RTP explained in 6 minutes (Multimedia 101 #10)" |
| Keywords | how webrtc works, webrtc explained, sdp offer answer, ice candidates, rtp udp, webrtc vs hls latency, webrtc signaling server |
| Source | Ch. 4 slide "WebRTC", `materials/Chapter 4/DEEP_DIVE.md` section "WebRTC", Ch. 4 BONUS hints on ICE and VPN |
| On screen | Diagram: two peers, a signaling channel (WebSocket) above them, the media connection below. Sequence: offer → answer → candidates. An RTP packet drawn as a small box with a sequence number and a timestamp. A latency bar comparing HLS and WebRTC. |

## Facts that must land

- WebRTC is a set of protocols for sending audio and video between two peers, usually browsers, with very low delay. It's what powers video calls in the browser. A server, or a Membrane pipeline, can be one of the peers.
- Before media flows: **signaling**. The peers agree on what they send, in which codecs, and how to reach each other: an SDP offer, an SDP answer, ICE candidates (network addresses).
- The standard does not say how signaling messages travel. That's up to you. A WebSocket is typical. "The signaling server is the thing you build around WebRTC."
- Then **connection**: ICE tries candidate address pairs until one works; DTLS encryption is always on.
- Then **media**: small RTP packets, usually over UDP. Late is worse than lost.
- Typical codecs: VP8 or H.264 for video, Opus for audio.
- Contrast: HLS and DASH cut video into segments served over HTTP, seconds of latency, scale to millions. WebRTC: hundreds of milliseconds, one connection per viewer.
- In Membrane a pipeline can be a WebRTC peer; buffers of VP8 or Opus come out like they would from a file. The WebRTC implementation underneath, `ex_webrtc`, is written in Elixir.

---

## Version A (detailed)

**[0:00] Cold open. On camera, a video call window visible on screen or a phone in hand.**

> Your browser can send live video to another browser on the other side of the planet with
> about a hundred milliseconds of delay. No plugin, no app, no server in between touching the
> pixels. That's WebRTC. Six minutes on how it works.

**[0:15] Bumper**

**[0:20] On camera**

> WebRTC, Web Real-Time Communication, is not one protocol. It's a bundle of them, standardised
> so that two peers, usually browsers, can send audio and video to each other directly. A peer
> doesn't have to be a browser. A server can be one. A Membrane pipeline can be one, and we'll
> get to that at the end. Today: the three phases every WebRTC connection goes through.

**[0:45] Phase 1: signaling. Diagram, two peers, nothing between them yet.**

> Phase one. Two peers who want to talk know nothing about each other. Not the codecs the other
> side supports, not the resolution, not even the IP address. Before any media moves they have to
> agree on all of that. That negotiation is called signaling.

> It happens with three kinds of messages. The first peer sends an SDP offer: a text document
> listing what it wants to send and receive, which codecs, which encryption keys. The second peer
> replies with an SDP answer: here's the subset I agree to. And both sides exchange ICE candidates:
> the network addresses each one can be reached at. Your LAN address, your public address as seen
> by a helper server, maybe a relay.

**[1:35] The signaling punchline. Draw the signaling channel above the peers.**

> And here's the part that surprises everyone: the WebRTC standard does not say how these
> messages get from one peer to the other. At all. It's your problem. Email them. Print them out.
> In practice you use something you already have: a WebSocket, an HTTP endpoint, a chat channel.
> That piece of infrastructure is what people mean by "a signaling server". It's not part of
> WebRTC. It's the thing you build around it. And it only carries a few text messages at the
> start; once the connection is up, it can go away.

**[2:10] Phase 2: connection. Lower part of the diagram.**

> Phase two. Once both sides have each other's candidate addresses, they try them, pairwise,
> until one works. That's ICE, Interactive Connectivity Establishment. Behind a home router it
> usually works directly; behind a strict corporate firewall it may fall back to a relay. One
> practical consequence: if one side is on a VPN, the VPN address may get picked first and be
> unreachable for the other, and you get a connection that "signals fine but shows nothing".
> Then they set up encryption, DTLS, always on, you can't turn it off. And media starts flowing.

**[2:50] Phase 3: media. The RTP packet.**

> Phase three, the actual video. It goes as RTP: small packets, each with a sequence number and a
> timestamp, carrying a slice of an encoded frame. Usually over UDP, not TCP. That's deliberate.
> TCP guarantees delivery and order, and pays for it with retransmissions and waiting. For a live
> call, a frame that arrives two hundred milliseconds late is worthless; you've already shown the
> next one. Better to lose it and move on. UDP loses it and moves on.

> The codecs are the ones from the codecs episode: VP8 or H.264 for video, and for audio, Opus,
> which was designed for exactly this, low delay, variable bitrate, handles speech and music.

**[3:30] Contrast with HLS. Latency bar.**

> How is this different from, say, a live stream on a big video platform? Those typically use
> HLS or DASH: the video is cut into segments of a few seconds, written as files, and the player
> downloads them over plain HTTP. Simple, cacheable, scales to millions. And ten to thirty seconds
> behind real time. WebRTC is a few hundred milliseconds, scales to a conversation, and needs a
> real connection per viewer. Different tools. Same codecs, same timestamps, same raw frames
> underneath.

**[4:00] In Membrane.**

> Where does Membrane sit in this? A Membrane pipeline can be a WebRTC peer. It runs the signaling
> over a WebSocket, does ICE and DTLS, receives or sends RTP, and on the pipeline side you see
> ordinary buffers of VP8 or Opus, with timestamps, the same way you'd see them coming out of a
> file. From there on, decoders, filters, encoders don't know or care that the other end is a
> browser. The WebRTC implementation underneath, `ex_webrtc`, is written in Elixir, no native
> WebRTC library involved, which on the BEAM means one process per connection and the usual
> supervision on top.

> In the composing-pipelines episode you'll see what that looks like in a spec: one component,
> a URL, and the browser connects.

**[4:40] Takeaway + next**

> Three phases. Signaling, which is your problem. Connection, ICE and encryption. Media, RTP over
> UDP, because late is worse than lost. Next: what changes in a pipeline when the source is a
> camera instead of a file. Live streams.

**[5:00] End**

---

## Version B (room for you)

**Hook, pick one:**

1. "A hundred milliseconds, no plugin, no server touching the pixels."
2. `[YOU: the first time WebRTC didn't work for you. Firewall? VPN? Symmetric NAT? Everyone has
   one of those stories and it's a good way into ICE.]`
3. Show `chrome://webrtc-internals` from a live call, scroll through it, "all of this is three
   phases".

**Beats:**

1. WebRTC = a bundle of protocols, peer to peer, a peer can be a server or a pipeline.
2. Signaling: offer, answer, ICE candidates. **The standard doesn't say how to deliver them.**
   "The signaling server is the thing you build around WebRTC." `[YOU: your take on why it was
   designed that way?]`
3. Connection: ICE tries address pairs, DTLS always. `[YOU: VPN as the enemy, the hint from the
   materials: signaling works, no video, because the VPN address wins.]`
4. Media: RTP, UDP. "Late is worse than lost." Codecs: VP8/H.264 + Opus.
5. Contrast with HLS/DASH: seconds vs milliseconds, scale vs conversation. `[YOU: an opinion on
   LL-HLS / WHIP / WHEP? One sentence, no more.]`
6. In Membrane: the pipeline as a peer, `ex_webrtc` in Elixir, buffers like from a file.
7. Next: live streams.

**What not to do:** don't explain STUN/TURN in detail (one sentence: "helper server / relay").
Don't go through SDP line by line. Don't go into simulcast, SFU vs MCU, bandwidth estimation.
Each of those is its own episode if the series continues.
