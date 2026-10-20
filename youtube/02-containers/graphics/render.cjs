// Overlay graphics for episode 02 (containers). See youtube/tools/overlays.cjs for the helpers.
// Run:  cd presentation && NODE_PATH=node_modules node ../youtube/02-containers/graphics/render.cjs
const path = require('path')
const { colors, arrow, box, stream, row, chain, render } = require('../../tools/overlays.cjs')

const OUT = path.resolve(__dirname, '..', 'images')

// ---------- episode-specific styles ----------
const css = `
/* terminal snippet */
.term { background:#0b1440; color:#dfe6f7; border-radius:18px; padding:30px 38px; font-family:'JetBrains Mono', monospace;
        font-variant-ligatures:none; font-size:24px; line-height:1.6; white-space:pre; }
.term .d { opacity:.55; }
.term .k { color:#87cce8; font-weight:700; }
.term .hl { background:#87cce8; color:#0b1440; font-weight:700; border-radius:6px; padding:0 8px; margin:0 -2px; }

/* strip of bytes */
.strip { display:flex; flex-direction:column; align-items:center; width:1040px; }
.frames { display:flex; }
.s1 .cells { border-color:transparent; }
.s1 .frame { margin-right:-15px; }
.frame { display:flex; flex-direction:column; align-items:center; margin-right:12px; }
.ts { font-size:22px; font-weight:600; color:var(--navy); height:34px; line-height:34px; visibility:hidden; }
.cells { display:flex; gap:3px; padding:6px; border:3px solid transparent; border-radius:10px; }
.cell { width:22px; height:40px; border-radius:4px; background:#cfd6e8; }
.s2 .cells, .s3 .cells, .s4 .cells { border-color:var(--navy); }
.s3 .ts, .s4 .ts { visibility:visible; }
.s4 .v .cell { background:var(--blue); }
.s4 .a .cell { background:var(--navy); }
.legend { display:flex; gap:36px; margin-top:22px; font-size:24px; font-weight:600; color:var(--navy); visibility:hidden; }
.s4 .legend { visibility:visible; }
.legend span::before { content:''; display:inline-block; width:22px; height:22px; border-radius:4px; margin-right:10px; vertical-align:-3px; }
.legend .lv::before { background:var(--blue); } .legend .la::before { background:var(--navy); }
.strip .caption { align-self:center; }

/* merge / split connectors */
.mcol { display:flex; flex-direction:column; justify-content:space-between; height:180px; }
.mcol > * { display:flex; align-items:center; }
.mcol.right > * { justify-content:flex-start; } .mcol.left > * { justify-content:flex-end; }
.conn { flex:none; }

/* interleaved chunks */
.chunks { display:flex; align-items:flex-end; }
.chunk { height:64px; display:flex; align-items:center; justify-content:center; font-size:26px; font-weight:700; border:2px solid var(--navy); margin-right:-2px; }
.chunk.v { width:120px; background:var(--blue); color:var(--navy); }
.chunk.a { width:96px; background:var(--navy); color:#fff; font-size:24px; }
.chunk.first { border-radius:12px 0 0 12px; } .chunk.last { border-radius:0 12px 12px 0; }
.ticks { display:flex; margin-top:10px; font-size:22px; color:var(--navy); font-weight:600; }
.ticks span { width:216px; }

/* two shapes of H.264 */
.shape { display:flex; align-items:center; margin:14px 0; }
.shape .lbl { width:460px; font-size:26px; font-weight:600; color:var(--navy); }
.shape .lbl small { display:block; font-size:21px; font-weight:400; opacity:.7; }
.u { height:60px; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:600; border:2px solid var(--navy); margin-right:6px; border-radius:8px; }
.u.f { width:86px; background:var(--blue); color:var(--navy); }
.u.ps { width:62px; background:#fff; color:var(--navy); border-style:dashed; }
.u.hdr { width:150px; background:var(--soft); color:var(--navy); border-width:3px; margin-right:22px; }

/* hex dump */
.hex { display:flex; gap:48px; align-items:flex-start; }
.hexgrid { font-family:'JetBrains Mono', monospace; font-variant-ligatures:none; font-size:27px; line-height:1.9; white-space:nowrap; color:var(--ink); }
.hexgrid .off { opacity:.45; margin-right:18px; }
.hexgrid .b { padding:4px 5px; border-radius:6px; }
.hexgrid .b + .b { margin-left:4px; }
.hexleg { font-size:24px; line-height:1.75; color:var(--ink); }
.hexleg div::before { content:''; display:inline-block; width:22px; height:22px; border-radius:5px; margin-right:12px; vertical-align:-3px; background:var(--c); box-sizing:border-box; }
.hexleg div.plain::before { border:2px solid #cfd6e8; }
.hexleg b { color:var(--navy); }

/* pipeline rows */
.prow { height:122px; display:flex; align-items:center; justify-content:flex-end; }
.pcol { display:flex; flex-direction:column; gap:26px; }
.box small { display:block; font-size:21px; font-weight:400; opacity:.8; margin-top:2px; }
`

// ---------- small helpers ----------
const sp = (cls, t) => `<span class="${cls}">${t}</span>`

// two inputs merging into one (height matches .mcol)
const merge = `<svg class="conn" width="90" height="180" viewBox="0 0 90 180">
  <path d="M0,34 C45,34 45,90 78,90" fill="none" stroke="${colors.navy}" stroke-width="2"/>
  <path d="M0,146 C45,146 45,90 78,90" fill="none" stroke="${colors.navy}" stroke-width="2"/>
  <polygon points="76,84 90,90 76,96" fill="${colors.navy}"/></svg>`
// one output splitting into two
const split = `<svg class="conn" width="90" height="180" viewBox="0 0 90 180">
  <path d="M0,90 C45,90 45,34 78,34" fill="none" stroke="${colors.navy}" stroke-width="2"/>
  <path d="M0,90 C45,90 45,146 78,146" fill="none" stroke="${colors.navy}" stroke-width="2"/>
  <polygon points="76,28 90,34 76,40" fill="${colors.navy}"/><polygon points="76,140 90,146 76,152" fill="${colors.navy}"/></svg>`
// pipeline merge, taller (two .prow + gap)
const pmerge = `<svg class="conn" width="90" height="270" viewBox="0 0 90 270">
  <path d="M0,61 C45,61 45,135 78,135" fill="none" stroke="${colors.navy}" stroke-width="2"/>
  <path d="M0,209 C45,209 45,135 78,135" fill="none" stroke="${colors.navy}" stroke-width="2"/>
  <polygon points="76,129 90,135 76,141" fill="${colors.navy}"/></svg>`

// ---------- 01 ffprobe ----------
const ffprobe = which => {
  const h = (t, key) => (which === key || (which === 'entries' && (key === 'avc1' || key === 'mp4a'))) ? sp('hl', t) : t
  return `<div class="term">${sp('d', "Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'bbb_h264_aac.mp4':")}
${sp('d', '  Duration: 00:00:33.04, bitrate: 943 kb/s')}
  Stream #0:0: Video: ${h('h264', 'codec')} (Constrained Baseline) (${h('avc1', 'avc1')} / 0x31637661), 480x270, 25 fps
  Stream #0:1: Audio: ${h('aac', 'codec')} (LC) (${h('mp4a', 'mp4a')} / 0x6134706D), 44100 Hz, stereo, 127 kb/s</div>`
}

// ---------- 02 bytes strip ----------
const FRAMES = [[5, 'v', '0 ms'], [2, 'a', '0 ms'], [4, 'v', '40 ms'], [2, 'a', '23 ms'], [6, 'v', '80 ms'], [2, 'a', '46 ms'], [4, 'v', '120 ms'], [2, 'a', '70 ms']]
const bytes = step => `<div class="strip s${step}">
  <div class="frames">${FRAMES.map(([n, t, ts]) =>
    `<div class="frame ${t}"><div class="ts">${ts}</div><div class="cells">${'<div class="cell"></div>'.repeat(n)}</div></div>`).join('')}</div>
  <div class="legend"><span class="lv">video track</span><span class="la">audio track</span></div>
  <div class="caption">${['an encoded stream is just bytes', 'where each frame starts', 'when to show it', 'which track it belongs to'][step - 1]}</div>
</div>`

// ---------- 03 codec vs container ----------
const codecVsContainer = `<div class="pills">
  <div class="pill"><h3>Codec</h3><div><b>how the media is compressed</b></div><div>H.264 · VP8 · AAC · MP3</div></div>
  <div class="pill"><h3>Container</h3><div><b>how the streams are packaged</b></div><div>MP4 · MKV · WebM · IVF</div></div>
</div>`

// ---------- 04 three containers ----------
const threeContainers = `<div class="pills">
  <div class="pill"><h3>MP4</h3><div>many tracks</div><div>jump to any point</div><div>plays everywhere</div></div>
  <div class="pill"><h3>IVF</h3><div>one video track</div><div>32-byte header</div><div>12 bytes per frame</div></div>
  <div class="pill"><h3>MP3</h3><div>no container</div><div>every frame has</div><div>its own header</div></div>
</div>`

// ---------- 05 IVF header hex ----------
const HEXROWS = [
  ['00000000', '44 4b 49 46 00 00 20 00 56 50 38 30 e0 01 0e 01'],
  ['00000010', '19 00 00 00 01 00 00 00 2c 03 00 00 00 00 00 00'],
  ['00000020', '19 01 00 00 00 00 00 00 00 00 00 00 10 21 00 9d'],
]
// byte index -> field
const FIELDS = [
  { n: 'sig', c: '#87cce8', from: 0, to: 3, label: '<b>DKIF</b>, the IVF signature' },
  { n: 'ver', c: '#e3e7f3', from: 4, to: 7, label: 'version 0, header length 32' },
  { n: 'fourcc', c: '#ffe08a', from: 8, to: 11, label: '<b>VP80</b>, the codec' },
  { n: 'w', c: '#c3f0c8', from: 12, to: 13, label: 'width <b>480</b>' },
  { n: 'h', c: '#f9c6c6', from: 14, to: 15, label: 'height <b>270</b>' },
  { n: 'rate', c: '#d9c8f5', from: 16, to: 23, label: 'time base 1/<b>25</b> s' },
  { n: 'cnt', c: '#ffd6a8', from: 24, to: 27, label: '<b>812</b> frames' },
  { n: 'unused', c: '#e3e7f3', from: 28, to: 31, label: 'unused' },
  { n: 'fsize', c: '#bfe3ff', from: 32, to: 35, label: 'first frame: <b>281</b> bytes' },
  { n: 'fts', c: '#efe3c3', from: 36, to: 43, label: 'first frame: timestamp <b>0</b>' },
  { n: 'data', c: '#ffffff', from: 44, to: 47, label: 'the VP8 frame itself' },
]
const fieldOf = i => FIELDS.find(f => i >= f.from && i <= f.to)
const hex = `<div class="hex">
  <div class="hexgrid">${HEXROWS.map(([off, bs], r) =>
    `<div><span class="off">${off}</span>${bs.split(' ').map((b, i) => {
      const f = fieldOf(r * 16 + i)
      const border = f && f.c === '#ffffff' ? 'box-shadow:inset 0 0 0 2px #cfd6e8;' : ''
      return `<span class="b" style="background:${f ? f.c : '#fff'};${border}">${b}</span>`
    }).join('')}</div>`).join('')}</div>
  <div class="hexleg">${FIELDS.filter(f => f.n !== 'unused' && f.n !== 'ver').map(f =>
    `<div class="${f.c === '#ffffff' ? 'plain' : ''}" style="--c:${f.c}">${f.label}</div>`).join('')}</div>
</div>`

// ---------- 06 mux, 08 demux ----------
const mux = row(`<div class="mcol left">${stream('H.264 stream')}${stream('AAC stream')}</div>`, merge, box('MP4 muxer'), arrow, stream('MP4'))
const demux = row(stream('MP4'), arrow, box('MP4 demuxer'), split,
  `<div class="mcol right"><div>${stream('H.264 stream')}${arrow}${box('decoder', 'plain')}</div><div>${stream('AAC stream')}${arrow}${box('decoder', 'plain')}</div></div>`)

// ---------- 07 interleaved ----------
const interleaved = `<div>
  <div class="chunks">${[...Array(5)].map((_, i) =>
    `<div class="chunk v${i === 0 ? ' first' : ''}">video</div><div class="chunk a${i === 4 ? ' last' : ''}">audio</div>`).join('')}</div>
  <div class="ticks">${['0 s', '1 s', '2 s', '3 s', '4 s'].map(t => `<span>${t}</span>`).join('')}</div>
  <div class="caption">one MP4 file: chunks of video and audio, interleaved, each with its timestamps</div>
</div>`

// ---------- 09 two shapes ----------
const unit = (cls, t) => `<div class="u ${cls}">${t}</div>`
const twoShapes = `<div>
  <div class="shape"><div class="lbl">in the stream<small>parameter sets repeated before key frames</small></div>
    ${unit('ps', 'PS')}${unit('f', 'frame')}${unit('f', 'frame')}${unit('f', 'frame')}${unit('ps', 'PS')}${unit('f', 'frame')}${unit('f', 'frame')}</div>
  <div class="shape"><div class="lbl">in the MP4 header<small>stored once, in a box called avc1</small></div>
    ${unit('hdr', 'avc1: PS')}${unit('f', 'frame')}${unit('f', 'frame')}${unit('f', 'frame')}${unit('f', 'frame')}${unit('f', 'frame')}${unit('f', 'frame')}</div>
</div>`

// ---------- 10 pipeline ----------
const pipeline = hl => {
  const b = (t, key) => box(t, key === hl ? 'hl' : '')
  const top = row(stream('bbb_vp8.ivf'), arrow, b('File.Source', 'ivfsrc'), arrow, b('IVF.Deserializer', 'ivf'), arrow,
    b('Transcoder<small>VP8 → H.264</small>', 'vt'))
  const bottom = row(stream('bbb.mp3'), arrow, b('File.Source<small>content format: MPEG audio</small>', 'mp3src'), arrow,
    b('Transcoder<small>MP3 → AAC</small>', 'at'))
  return row(`<div class="pcol"><div class="prow">${top}</div><div class="prow">${bottom}</div></div>`, pmerge,
    b('MP4.Muxer.ISOM', 'mux'), arrow, b('File.Sink', 'sink'), arrow, stream('result.mp4'))
}

// ---------- 11 takeaway ----------
const takeaway = `<div class="big">Codec: how the media is compressed.<br>Container: how the streams are packaged.</div>
<div class="big muted" style="margin-top:18px">A muxer puts streams in, a demuxer takes them out.</div>`

const graphics = [
  ['01-ffprobe', ffprobe('codec')],
  ['01-ffprobe-entries', ffprobe('entries')],
  ['02-bytes-1', bytes(1)], ['02-bytes-2', bytes(2)], ['02-bytes-3', bytes(3)], ['02-bytes-4', bytes(4)],
  ['03-codec-vs-container', codecVsContainer],
  ['04-three-containers', threeContainers],
  ['05-ivf-header', hex],
  ['06-mux', mux],
  ['07-interleaved', interleaved],
  ['08-demux', demux],
  ['09-two-shapes', twoShapes],
  ['10-pipeline-1', pipeline(null)], ['10-pipeline-2', pipeline('ivf')], ['10-pipeline-3', pipeline('mux')], ['10-pipeline-4', pipeline('mp3src')],
  ['11-takeaway', takeaway],
]

render(graphics, OUT, null, css)
