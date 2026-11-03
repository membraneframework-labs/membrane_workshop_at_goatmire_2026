// Overlay graphics for episode 04 (raw audio and video). See youtube/tools/overlays.cjs for the helpers.
// Run:  cd presentation && NODE_PATH=node_modules node ../youtube/04-raw-audio-and-video/graphics/render.cjs
// Add --preview to also render the alternatives into images/_preview/.
const path = require('path')
const { colors, box, stream, vchain, render } = require('../../tools/overlays.cjs')

const OUT = path.resolve(__dirname, '..', 'images')

// ---------- episode-specific styles ----------
const css = `
/* hex dump of a raw frame: no structure, nothing to colour */
.hexgrid { font-family:'JetBrains Mono', monospace; font-variant-ligatures:none; font-size:27px; line-height:1.9; white-space:nowrap; color:var(--ink); }
.hexgrid .off { opacity:.45; margin-right:28px; }
.hexgrid .b { padding:0 5px; }
.hexgrid .b + .b { margin-left:4px; }

/* pixels folded into rows */
.rows { display:flex; flex-direction:column; align-items:center; }
.rowsbox { position:relative; width:1482px; height:276px; display:flex; align-items:center; justify-content:center; }
.px { width:56px; height:56px; border-radius:6px; box-sizing:border-box; position:relative; background:var(--soft); border:2px solid var(--navy); }
.px i { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-style:normal;
        font-family:'JetBrains Mono', monospace; font-size:24px; font-weight:500; color:var(--navy); }
.strip1 { display:flex; gap:6px; }
.grid { display:grid; grid-template-columns:repeat(6, 56px); gap:6px; }
.rowsbox.s3 .px { opacity:.25; }
.rowsbox.s3 .px.keep { opacity:1; }
.rowsbox.s3 .px.found { background:var(--navy); }
.rowsbox.s3 .px.found i { color:#fff; }
.rowsbox svg { position:absolute; left:0; top:0; overflow:visible; }
.rowlbl { position:absolute; font-size:24px; font-weight:600; color:var(--navy); white-space:nowrap; }

/* the two by two RGB frame and its twelve bytes */
.rgb { display:flex; flex-direction:column; align-items:center; }
.frame2 { display:grid; grid-template-columns:repeat(2, 110px); gap:6px; padding:8px; border:3px solid var(--navy); border-radius:12px; }
.frame2 div { height:110px; border-radius:6px; display:flex; align-items:center; justify-content:center; }
.frame2 div b, .swatch b { color:#fff; font-weight:700; text-shadow:0 1px 3px rgba(0,0,0,.45); }
.frame2 div b { font-size:40px; }
.swatch { display:flex; align-items:center; justify-content:center; } .swatch b { font-size:30px; }
/* alternative: one pixel, three bytes */
.onepx { display:flex; align-items:center; gap:40px; }
.onepx .big1 { width:150px; height:150px; border-radius:12px; border:3px solid var(--navy); }
.onepx .eq { font-size:48px; color:var(--navy); }
.onepx .cells3 { display:flex; gap:8px; }
.onepx .byte { width:120px; height:110px; font-size:34px; flex-direction:column; gap:4px; }
.onepx .byte small { font-size:20px; font-weight:600; opacity:.75; }
.bytes { display:flex; gap:26px; }
/* the two labels that say what each half is: the picture above, the same frame in memory below */
.rgblbl { font-size:24px; font-weight:600; color:var(--navy); margin:0 0 14px; }
.rgblbl.mem { margin-top:26px; }
.memstrip { position:relative; padding:18px 22px 14px; border:2px dashed var(--navy); border-radius:14px; background:#fff; }
.memstrip .offs { display:flex; gap:26px; margin-top:8px; }
.memstrip .offs .triple { gap:0; }
.memstrip .offs .cells3 div { width:64px; text-align:center; font-family:'JetBrains Mono', monospace; font-size:19px; color:var(--ink); opacity:.65; }
.triple { display:flex; flex-direction:column; align-items:center; }
.swatch { width:56px; height:56px; border-radius:8px; border:2px solid var(--navy); margin-bottom:12px; }
.triple .cells3 { display:flex; gap:4px; }
.byte { width:64px; height:62px; display:flex; align-items:center; justify-content:center; font-family:'JetBrains Mono', monospace; font-variant-ligatures:none; font-size:26px; font-weight:500; color:var(--ink); border-radius:8px; }
.byte.r { background:#ffd9d4; } .byte.g { background:#d2f0da; } .byte.b { background:#d6e2ff; }
.rgbkey { display:flex; gap:36px; margin-top:22px; font-size:24px; font-weight:600; color:var(--navy); }
.rgbkey span::before { content:''; display:inline-block; width:22px; height:22px; border-radius:5px; margin-right:10px; vertical-align:-3px; }
.rgbkey .kr::before { background:#ffd9d4; } .rgbkey .kg::before { background:#d2f0da; } .rgbkey .kb::before { background:#d6e2ff; }
.rowtag { font-size:22px; color:var(--ink); opacity:.7; margin-top:12px; }

/* I420: three planes */
.planes3 { display:flex; gap:48px; align-items:flex-start; padding:22px 28px 18px; }
.plane { display:flex; flex-direction:column; align-items:center; }
.plane .lbl { margin-top:14px; font-size:24px; font-weight:600; color:var(--navy); text-align:center; white-space:nowrap; line-height:1.3; }
.plane .lbl small { display:block; font-size:21px; font-weight:400; opacity:.75; }
.pic24 { margin-bottom:0; }
.pgrid { display:grid; gap:6px; }
.pgrid.w6 { grid-template-columns:repeat(6, 46px); }
.pgrid.w3 { grid-template-columns:repeat(3, 96px); }
.pgrid.w3 .yc { width:96px; height:96px; }
.plane .lbl b { display:block; font-size:26px; font-weight:700; color:var(--navy); margin-top:2px; }
.yc { width:46px; height:46px; border-radius:6px; border:1px solid rgba(0,26,114,.25); box-sizing:border-box; }
.i420 { display:flex; flex-direction:column; align-items:center; }

/* audio samples */
.wave { display:block; }

/* interleaved stereo samples */
.samples { display:flex; flex-direction:column; align-items:center; }
.scells { display:flex; gap:18px; }
.sample { display:flex; flex-direction:column; align-items:center; }
.sample .ch { font-size:26px; font-weight:700; color:var(--navy); height:40px; line-height:40px; }
.sample .two { display:flex; gap:3px; padding:5px; border:3px solid var(--navy); border-radius:10px; }
.sample.l .two { background:var(--soft); }
.sample .byte { width:58px; height:56px; font-size:25px; background:#fff; border:1px solid #cfd6e8; }
.sample .val { margin-top:10px; font-size:22px; color:var(--ink); opacity:.7; font-variant-numeric:tabular-nums; }
.caps { display:flex; gap:48px; margin-top:26px; font-size:24px; font-weight:600; color:var(--navy); }
.caps span { opacity:.75; }

/* terminal panel */
.term { background:#0b1440; color:#dfe6f7; border-radius:18px; padding:30px 38px; font-family:'JetBrains Mono', monospace;
.term.structs { font-size:27px; line-height:1.6; }
        font-variant-ligatures:none; font-size:24px; line-height:1.6; white-space:pre; }
.term .d { opacity:.55; }
.term .hl { background:#87cce8; color:#0b1440; font-weight:700; border-radius:6px; padding:0 8px; margin:0 -2px; }
.terms { display:flex; flex-direction:column; gap:28px; }

/* pipeline without a muxer: two branches, tops aligned */
.vcols.top { align-items:flex-start; }
`

// ---------- small helpers ----------
const sp = (cls, t) => `<span class="${cls}">${t}</span>`

// ---------- 01 hex dump ----------
// Real bytes of video.raw written by example/ivf_mp3_to_raw.exs (I420, 480x270, 194 400 bytes per frame):
//   xxd -s $((194400*100 + 480*120 + 160)) -l 160 video.raw
// frame 100, row 120 of the Y plane, columns 160..319: a slice through the title card, so the bytes vary.
const HEXROWS = [
  ['01298320', '9c ab 9d 98 97 9d 9a 88 7e 7b 72 81 98 99 98 99'],
  ['01298330', '99 9b 9a 9b 9b 9c 9a 9d 9a 91 7e 77 73 6f 70 74'],
  ['01298340', '6d 85 a7 b6 af a8 a0 a5 9d 72 67 78 6d 6f 6f 73'],
  ['01298350', '7e 8b a1 bf d5 dc d2 ca b2 9e 9f 94 81 79 76 72'],
  ['01298360', '6e 6b 64 69 a0 a1 a3 7c 68 6f 6d 86 a1 a6 a5 a3'],
  ['01298370', '84 9d 9a 6a 65 57 4f 7e 9e 9b 9b 9d 9d 9e 9c 9f'],
  ['01298380', 'a5 ac 89 6e 78 72 7f a6 a5 98 97 96 79 8f 9c 7c'],
  ['01298390', '62 71 6b 82 93 97 97 97 a7 ae 9e 80 65 59 51 50'],
  ['012983a0', '6d 80 8d 9c a2 9c 96 96 8c 6b 65 6d 72 88 9a 9a'],
  ['012983b0', '99 98 9d 8d 77 66 67 63 63 8a 8f 67 69 71 64 82'],
]
const hexdump = `<div class="hexgrid">${HEXROWS.map(([off, bs]) =>
  `<div><span class="off">${off}</span>${bs.split(' ').map(b => `<span class="b">${b}</span>`).join('')}</div>`).join('')}</div>`

// ---------- 02 pixels folded into rows ----------
// a 6 x 4 picture: two rows of sky with a sun, two rows of ground
const W = 6, H = 4
const SKY = '#87cce8', SKY2 = '#a9dbf0', SUN = '#fff3b0', GROUND = '#2f9e6f', GROUND2 = '#1d7a52'
const PIC = [
  [SKY, SKY, SKY, SKY2, SUN, SKY],
  [SKY2, SKY, SKY2, SKY, SKY, SKY2],
  [GROUND, GROUND2, GROUND, GROUND, GROUND2, GROUND],
  [GROUND2, GROUND, GROUND2, GROUND2, GROUND, GROUND2],
].flat()
const CELL = 56, GAP = 6, PITCH = CELL + GAP
const FOUND = { x: 3, y: 2 } // skip two full rows, then move three along the third
// every square is one pixel, numbered by its position in memory (0 to 23); no colours, so the
// squares read as positions, not as a picture (the coloured PIC is still used by 04-i420)
const px = (i, step) => {
  const x = i % W, y = Math.floor(i / W)
  const keep = step === 3 && (y < FOUND.y || (y === FOUND.y && x <= FOUND.x))
  const found = step === 3 && y === FOUND.y && x === FOUND.x
  return `<div class="px${keep ? ' keep' : ''}${found ? ' found' : ''}"><i>${i}</i></div>`
}
const rows = step => {
  const gridW = W * PITCH - GAP, gridH = H * PITCH - GAP
  // the grid stays centred in every step; in step 3 one label goes left of the path and one right
  // of the bracket, so the picture stays balanced without moving the grid
  const gx = (1482 - gridW) / 2, gy = 8
  let inner
  if (step === 1) inner = `<div class="strip1">${PIC.map((c, i) => px(i, 1)).join('')}</div>`
  else inner = `<div class="grid" style="position:absolute; left:${gx}px; top:${gy}px">${PIC.map((c, i) => px(i, step)).join('')}</div>`
  let overlay = ''
  if (step === 3) {
    // a bracket on the right for the two skipped rows, a bracket under the three pixels walked along the third row
    const yRows = gy + 2 * PITCH - GAP, xr = gx + gridW + 22
    const yUnder = gy + H * PITCH - GAP + 14, xa = gx, xb = gx + 3 * PITCH - GAP
    overlay = `<svg width="1482" height="276">
      <line x1="${xr}" y1="${gy}" x2="${xr}" y2="${yRows}" stroke="${colors.navy}" stroke-width="3"/>
      <line x1="${xr - 10}" y1="${gy}" x2="${xr + 10}" y2="${gy}" stroke="${colors.navy}" stroke-width="3"/>
      <line x1="${xr - 10}" y1="${yRows}" x2="${xr + 10}" y2="${yRows}" stroke="${colors.navy}" stroke-width="3"/>
      <line x1="${xa}" y1="${yUnder}" x2="${xb}" y2="${yUnder}" stroke="${colors.navy}" stroke-width="3"/>
      <line x1="${xa}" y1="${yUnder - 10}" x2="${xa}" y2="${yUnder + 10}" stroke="${colors.navy}" stroke-width="3"/>
      <line x1="${xb}" y1="${yUnder - 10}" x2="${xb}" y2="${yUnder + 10}" stroke="${colors.navy}" stroke-width="3"/>
    </svg>
    <div class="rowlbl" style="left:${xr + 24}px; top:${gy + PITCH - GAP - 16}px">skip 2 full rows</div>
    <div class="rowlbl" style="right:${1482 - gx + 24}px; top:${yUnder - 16}px">then 3 along the row</div>`
  }
  const caption = [
    'each square is one pixel',
    '&nbsp;',
    'pixel 15',
  ][step - 1]
  return `<div class="rows"><div class="rowsbox s${step}">${inner}${overlay}</div><div class="caption">${caption}</div></div>`
}

// ---------- 03 RGB ----------
const PIXELS = [
  { c: [220, 40, 40] }, { c: [240, 200, 40] },
  { c: [40, 170, 80] }, { c: [40, 90, 220] },
]
const rgbOf = ([r, g, b]) => `rgb(${r},${g},${b})`
// the picture on top, the same frame as it sits in memory below: one strip of 12 bytes in a dashed
// frame labelled as memory, with the byte offsets 0 to 11 under the cells
const LETTERS = ['A', 'B', 'C', 'D']
const rgb = `<div class="rgb">
  <div class="rgblbl">the picture</div>
  <div class="frame2">${PIXELS.map((p, j) => `<div style="background:${rgbOf(p.c)}"><b>${LETTERS[j]}</b></div>`).join('')}</div>
  <div class="rgblbl mem">the same frame in memory</div>
  <div class="memstrip">
    <div class="bytes">${PIXELS.map((p, j) => `<div class="triple"><div class="swatch" style="background:${rgbOf(p.c)}"><b>${LETTERS[j]}</b></div>
      <div class="cells3">${['r', 'g', 'b'].map((k, i) => `<div class="byte ${k}">${p.c[i]}</div>`).join('')}</div></div>`).join('')}</div>
    <div class="offs">${PIXELS.map((p, j) => `<div class="triple"><div class="cells3">${[0, 1, 2].map(i => `<div>${j * 3 + i}</div>`).join('')}</div></div>`).join('')}</div>
  </div>
  <div class="rgbkey"><span class="kr">red</span><span class="kg">green</span><span class="kb">blue</span></div>
</div>`

// alternative for 03: the RGB idea on a single pixel
const rgbOne = `<div class="rgb">
  <div class="rgblbl">one pixel</div>
  <div class="onepx">
    <div class="big1" style="background:${rgbOf(PIXELS[1].c)}"></div>
    <div class="eq">=</div>
    <div class="cells3">${['r', 'g', 'b'].map((k, i) => `<div class="byte ${k}">${PIXELS[1].c[i]}<small>${['red', 'green', 'blue'][i]}</small></div>`).join('')}</div>
  </div>
  <div class="caption">3 bytes per pixel, each from 0 to 255</div>
</div>`

// ---------- 04 I420 ----------
// the same 6 x 4 picture as in 02-rows, then the same frame in memory as I420: the Y plane
// (one grey byte per pixel), then the U plane, then the V plane (one byte per 2x2 block each),
// one after another, planar, not interleaved
const lum = ([r, g, b]) => Math.round(0.299 * r + 0.587 * g + 0.114 * b)
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
const YUV = (() => {
  const px = PIC.map(hex2rgb)
  const Y = px.map(lum)
  const U = [], V = []
  for (let by = 0; by < H / 2; by++) for (let bx = 0; bx < W / 2; bx++) {
    const idx = [0, 1, W, W + 1].map(d => (2 * by) * W + 2 * bx + d)
    const avg = k => idx.reduce((a, i) => a + px[i][k], 0) / 4
    const [r, g, b] = [avg(0), avg(1), avg(2)]
    U.push(Math.round(-0.169 * r - 0.331 * g + 0.5 * b + 128))
    V.push(Math.round(0.5 * r - 0.419 * g - 0.081 * b + 128))
  }
  return { Y, U, V }
})()
const cellY = y => `<div class="yc" style="background:rgb(${y},${y},${y})"></div>`
// a chroma plane is shown the way viewers show it: the pixel colour with mid grey brightness and the
// other chroma channel at neutral (BT.601 conversion), so U runs yellow-green to blue, V green to red
const clamp = x => Math.max(0, Math.min(255, Math.round(x)))
const cellU = u => `<div class="yc" style="background:rgb(128,${clamp(128 - 0.344 * (u - 128))},${clamp(128 + 1.772 * (u - 128))})"></div>`
const cellV = v => `<div class="yc" style="background:rgb(${clamp(128 + 1.402 * (v - 128))},${clamp(128 - 0.714 * (v - 128))},128)"></div>`
const i420 = `<div class="i420">
  <div class="rgblbl">the picture</div>
  <div class="pgrid w6">${PIC.map(c => `<div class="yc" style="background:${c}; border:2px solid var(--navy)"></div>`).join('')}</div>
  <div class="rgblbl mem">the same frame in memory as I420</div>
  <div class="memstrip planes3">
    <div class="plane"><div class="pgrid w6">${YUV.Y.map(cellY).join('')}</div><div class="lbl">Y · brightness<b>24 bytes</b></div></div>
    <div class="plane"><div class="pgrid w3">${YUV.U.map(cellU).join('')}</div><div class="lbl">U · colour<b>6 bytes</b></div></div>
    <div class="plane"><div class="pgrid w3">${YUV.V.map(cellV).join('')}</div><div class="lbl">V · colour<b>6 bytes</b></div></div>
  </div>
  <div class="caption">1.5 bytes per pixel on average</div>
</div>`

// ---------- 05 samples ----------
const samples = (() => {
  const w = 1100, h = 360, mid = 170, amp = 112
  const f = x => Math.sin((x - 40) / 65)  // a plain sine: what people picture when they think of sound
  const pts = []
  for (let x = 40; x <= w - 40; x += 4) pts.push(`${x},${(mid - amp * f(x)).toFixed(1)}`)
  const step = 51, dots = []  // eight samples per period, so every eighth dot sits on a peak or a trough
  for (let x = 91; x <= w - 60; x += step) dots.push(x)
  const labelled = new Set([1, 2, 5, 12])  // a peak, a point on the slope, a trough, one more: each sample is just a number
  const SCALE = 700 // the values the labels show, a 16-bit sample would go up to 32 767
  return `<svg class="wave" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <line x1="30" y1="${mid}" x2="${w - 30}" y2="${mid}" stroke="#cfd6e8" stroke-width="2"/>
    <polyline points="${pts.join(' ')}" fill="none" stroke="${colors.blue}" stroke-width="5" stroke-linejoin="round"/>
    ${dots.map((x, i) => {
      const y = mid - amp * f(x), v = Math.round(SCALE * f(x))
      const lab = labelled.has(i) ? `<text x="${x}" y="${v >= 0 ? y - 22 : y + 42}" text-anchor="middle" font-family="JetBrains Mono" font-size="24" font-weight="500" fill="${colors.navy}">${v < 0 ? '−' + (-v) : v}</text>` : ''
      return `<line x1="${x}" y1="${mid}" x2="${x}" y2="${y}" stroke="${colors.navy}" stroke-width="1.5" opacity=".35"/>
        <circle cx="${x}" cy="${y}" r="8" fill="${colors.navy}"/>${lab}`
    }).join('')}
  </svg>`
})()

// ---------- 06 interleaved ----------
// real bytes of audio.raw one second in: xxd -s 176400 -l 12 audio.raw → 0ffe 9501 34fe fb01 5dfe 5602
const STEREO = [['0f', 'fe', -497], ['95', '01', 405], ['34', 'fe', -460], ['fb', '01', 507], ['5d', 'fe', -419], ['56', '02', 598]]
const interleaved = `<div class="samples">
  <div class="scells">${STEREO.map(([b0, b1, v], i) => `<div class="sample ${i % 2 ? 'r' : 'l'}">
    <div class="ch">${i % 2 ? 'R' : 'L'}</div>
    <div class="two"><div class="byte">${b0}</div><div class="byte">${b1}</div></div></div>`).join('')}</div>
  <div class="caps"><span>one sample = 2 bytes</span><span>stereo, interleaved</span></div>
</div>`

// ---------- 08 stream format cards ----------
const streamFormat = `<div class="pills">
  <div class="pill"><h3>Raw video</h3><div><b>width</b></div><div><b>height</b></div><div><b>pixel format</b></div></div>
  <div class="pill"><h3>Raw audio</h3><div><b>sample rate</b></div><div><b>sample format</b></div><div><b>channels</b></div></div>
</div>`

// alternative: the real stream format structs this pipeline produces (notes/facts.md, item 12),
// the fields the script names highlighted, in the terminal style of 10-terminal
const kw = t => sp('hl', t)
const structs = `<div class="term structs">%Membrane.RawVideo{${kw('width: 480')}, ${kw('height: 270')}, ${kw('pixel_format: :I420')},
                   framerate: nil, aligned: true}

%Membrane.RawAudio{${kw('sample_rate: 44_100')}, ${kw('sample_format: :s16le')}, ${kw('channels: 2')}}</div>`

// ---------- 07 the sentence ----------
const sentence = `<div class="huge">Raw data doesn't describe itself.</div>`

// ---------- 09 pipeline ----------
const pipeline = (() => {
  const b = (t, sub) => box(t + (sub ? `<small>${sub}</small>` : ''))
  const video = vchain(stream('bbb_vp8.ivf'), b('File.Source'), b('IVF.Deserializer'), b('Transcoder', 'VP8 → raw video'), b('File.Sink'), stream('video.raw'))
  const audio = vchain(stream('bbb.mp3'), b('File.Source'), b('Transcoder', 'MP3 → raw audio'), b('File.Sink'), stream('audio.raw'))
  return `<div class="vcols top">${video}${audio}</div>`
})()

// ---------- 10 terminal ----------
const h = t => sp('hl', t)
const SIZES = [['bbb_vp8.ivf', '1031399'], ['video.raw', '157852800'], ['bbb.mp3', '529492'], ['audio.raw', '5833728']]  // byte counts
const listing = `${sp('d', '$ ')}wc -c ${SIZES.map(([n]) => n).join(' ')}
${SIZES.map(([n, s]) => `${s.padStart(9)} ${n}`).join('\n')}`  // as wc -c prints them, total line left out
const ffplayVideo = `${sp('d', '$ ')}ffplay ${h('-f rawvideo')} ${h('-pixel_format yuv420p')} ${h('-video_size 480x270')} ${h('-framerate 25')} video.raw`
const ffplayAudio = `${sp('d', '$ ')}ffplay ${h('-f s16le')} ${h('-ar 44100')} ${h('-ch_layout stereo')} audio.raw`
const terminalOne = `<div class="term">${listing}

${ffplayVideo}
${ffplayAudio}</div>`
const terminalSizes = `<div class="term">${listing}</div>`
const terminalFfplay = `<div class="term">${ffplayVideo}
${ffplayAudio}</div>`

// ---------- 11 takeaway ----------
const takeaway = `<div class="big">Raw data doesn't describe itself.</div>
<div class="big muted" style="margin-top:18px; font-weight:500">In Membrane, that's the stream format.</div>`

const graphics = [
  ['01-hexdump', hexdump],
  ['02-rows-1', rows(1)], ['02-rows-2', rows(2)], ['02-rows-3', rows(3)],
  ['03-rgb', rgb],
  ['04-i420', i420],
  ['05-samples', samples],
  ['06-interleaved', interleaved],
  ['08-stream-format', streamFormat],
  ['07-sentence', sentence],
  ['09-pipeline', pipeline],
  ['10-terminal', terminalOne],
  ['11-takeaway', takeaway],
]

render(graphics, OUT, null, css).then(() => {
  if (process.argv.includes('--preview')) {
    return render([
      ['10-terminal-A-one-panel', terminalOne],
      ['10-terminal-sizes', terminalSizes], ['10-terminal-ffplay', terminalFfplay],
      ['03-rgb-B-one-pixel', rgbOne],
      ['08-stream-format-B-structs', structs],
    ], path.join(OUT, '_preview'), null, css)
  }
})
