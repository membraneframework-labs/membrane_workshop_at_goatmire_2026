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
.rowsbox { position:relative; width:1242px; height:202px; display:flex; align-items:center; justify-content:center; }
.px { width:46px; height:46px; border-radius:6px; box-sizing:border-box; }
.strip1 { display:flex; gap:6px; }
.grid { display:grid; grid-template-columns:repeat(6, 46px); gap:6px; }
.rowsbox.s3 .px { opacity:.22; }
.rowsbox.s3 .px.keep { opacity:1; }
.rowsbox.s3 .px.found { outline:4px solid var(--navy); outline-offset:3px; }
.rowsbox svg { position:absolute; left:0; top:0; overflow:visible; }
.rowlbl { position:absolute; font-size:24px; font-weight:600; color:var(--navy); white-space:nowrap; }

/* the two by two RGB frame and its twelve bytes */
.rgb { display:flex; flex-direction:column; align-items:center; }
.frame2 { display:grid; grid-template-columns:repeat(2, 110px); gap:6px; padding:8px; border:3px solid var(--navy); border-radius:12px; }
.frame2 div { height:110px; border-radius:6px; }
.bytes { display:flex; gap:26px; margin-top:34px; }
.triple { display:flex; flex-direction:column; align-items:center; }
.swatch { width:30px; height:30px; border-radius:6px; border:2px solid var(--navy); margin-bottom:10px; }
.triple .cells3 { display:flex; gap:4px; }
.byte { width:64px; height:62px; display:flex; align-items:center; justify-content:center; font-family:'JetBrains Mono', monospace; font-variant-ligatures:none; font-size:26px; font-weight:500; color:var(--ink); border-radius:8px; }
.byte.r { background:#ffd9d4; } .byte.g { background:#d2f0da; } .byte.b { background:#d6e2ff; }
.rgbkey { display:flex; gap:36px; margin-top:22px; font-size:24px; font-weight:600; color:var(--navy); }
.rgbkey span::before { content:''; display:inline-block; width:22px; height:22px; border-radius:5px; margin-right:10px; vertical-align:-3px; }
.rgbkey .kr::before { background:#ffd9d4; } .rgbkey .kg::before { background:#d2f0da; } .rgbkey .kb::before { background:#d6e2ff; }
.rowtag { font-size:22px; color:var(--ink); opacity:.7; margin-top:12px; }

/* I420: three planes */
.planes { display:flex; gap:40px; align-items:flex-start; }
.plane { display:flex; flex-direction:column; align-items:center; }
.plane .lbl { margin-top:14px; font-size:24px; font-weight:600; color:var(--navy); text-align:center; white-space:nowrap; line-height:1.3; }
.plane .lbl small { display:block; font-size:21px; font-weight:400; opacity:.75; }
.pl { border:2px solid var(--navy); border-radius:8px; box-sizing:border-box; position:relative; overflow:hidden; }
.pl.y { width:480px; height:270px; background:
  radial-gradient(ellipse 60% 55% at 62% 58%, rgba(255,255,255,.55), transparent 70%),
  linear-gradient(170deg, #f1f1f1 0%, #cfcfcf 35%, #8a8a8a 70%, #4a4a4a 100%); }
.pl.u { width:240px; height:135px; background:linear-gradient(170deg, #d6e4ff 0%, #a9c0f2 60%, #7f98d6 100%); }
.pl.v { width:240px; height:135px; background:linear-gradient(170deg, #ffd9d4 0%, #f0a9a0 60%, #d1807a 100%); }
.pl::after { content:''; position:absolute; inset:0; background-image:
  linear-gradient(to right, rgba(0,26,114,.14) 1px, transparent 1px),
  linear-gradient(to bottom, rgba(0,26,114,.14) 1px, transparent 1px); background-size:var(--cell) var(--cell); }
.pl.y { --cell:15px; } .pl.u, .pl.v { --cell:15px; }
.uv { display:flex; flex-direction:column; gap:40px; }
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
const SKY = '#87cce8', SKY2 = '#a9dbf0', SUN = '#ffd166', GROUND = '#2f9e6f', GROUND2 = '#1d7a52'
const PIC = [
  [SKY, SKY, SKY, SKY2, SUN, SKY],
  [SKY2, SKY, SKY2, SKY, SKY, SKY2],
  [GROUND, GROUND2, GROUND, GROUND, GROUND2, GROUND],
  [GROUND2, GROUND, GROUND2, GROUND2, GROUND, GROUND2],
].flat()
const CELL = 46, GAP = 6, PITCH = CELL + GAP
const FOUND = { x: 3, y: 2 } // skip two full rows, then move three along the third
const px = (c, i, step) => {
  const x = i % W, y = Math.floor(i / W)
  const keep = step === 3 && (y < FOUND.y || (y === FOUND.y && x <= FOUND.x))
  const found = step === 3 && y === FOUND.y && x === FOUND.x
  return `<div class="px${keep ? ' keep' : ''}${found ? ' found' : ''}" style="background:${c}"></div>`
}
const rows = step => {
  const gridW = W * PITCH - GAP, gridH = H * PITCH - GAP
  const gx = (1242 - gridW) / 2, gy = (202 - gridH) / 2
  let inner
  if (step === 1) inner = `<div class="strip1">${PIC.map((c, i) => px(c, i, 1)).join('')}</div>`
  else inner = `<div class="grid">${PIC.map((c, i) => px(c, i, step)).join('')}</div>`
  let overlay = ''
  if (step === 3) {
    // the path: down past two rows at the left edge, then along the third row to the found pixel
    const x0 = gx - 26, yTop = gy, yRow = gy + FOUND.y * PITCH + CELL / 2
    const xEnd = gx + FOUND.x * PITCH - 8
    overlay = `<svg width="1242" height="202">
      <path d="M${x0},${yTop} L${x0},${yRow} L${xEnd - 14},${yRow}" fill="none" stroke="${colors.navy}" stroke-width="4" stroke-linejoin="round"/>
      <polygon points="${xEnd - 16},${yRow - 9} ${xEnd},${yRow} ${xEnd - 16},${yRow + 9}" fill="${colors.navy}"/>
      <line x1="${gx + gridW + 22}" y1="${gy}" x2="${gx + gridW + 22}" y2="${gy + 2 * PITCH - GAP}" stroke="${colors.navy}" stroke-width="3"/>
      <line x1="${gx + gridW + 12}" y1="${gy}" x2="${gx + gridW + 32}" y2="${gy}" stroke="${colors.navy}" stroke-width="3"/>
      <line x1="${gx + gridW + 12}" y1="${gy + 2 * PITCH - GAP}" x2="${gx + gridW + 32}" y2="${gy + 2 * PITCH - GAP}" stroke="${colors.navy}" stroke-width="3"/>
    </svg>
    <div class="rowlbl" style="left:${gx + gridW + 46}px; top:${gy + PITCH - GAP - 16}px">skip 2 full rows</div>
    <div class="rowlbl" style="left:${gx + gridW + 46}px; top:${yRow - 16}px">then 3 along the row</div>`
  }
  const caption = [
    'one frame: the pixels one after another, row by row',
    'the width says where one row ends and the next begins',
    'skip the rows above it, then move along its row',
  ][step - 1]
  return `<div class="rows"><div class="rowsbox s${step}">${inner}${overlay}</div><div class="caption">${caption}</div></div>`
}

// ---------- 03 RGB ----------
const PIXELS = [
  { c: [220, 40, 40] }, { c: [240, 200, 40] },
  { c: [40, 170, 80] }, { c: [40, 90, 220] },
]
const rgbOf = ([r, g, b]) => `rgb(${r},${g},${b})`
const rgb = `<div class="rgb">
  <div class="frame2">${PIXELS.map(p => `<div style="background:${rgbOf(p.c)}"></div>`).join('')}</div>
  <div class="bytes">${PIXELS.map(p => `<div class="triple"><div class="swatch" style="background:${rgbOf(p.c)}"></div>
    <div class="cells3">${['r', 'g', 'b'].map((k, i) => `<div class="byte ${k}">${p.c[i]}</div>`).join('')}</div></div>`).join('')}</div>
  <div class="rgbkey"><span class="kr">red</span><span class="kg">green</span><span class="kb">blue</span></div>
  <div class="caption">2 × 2 pixels · 3 bytes per pixel · 12 bytes, the first row and then the second</div>
</div>`

// ---------- 04 I420 ----------
const i420 = `<div class="i420"><div class="planes">
  <div class="plane"><div class="pl y"></div><div class="lbl">Y · brightness<small>1 byte per pixel</small></div></div>
  <div class="uv">
    <div class="plane"><div class="pl u"></div><div class="lbl">U<small>1 byte per 2×2 block</small></div></div>
    <div class="plane"><div class="pl v"></div><div class="lbl">V<small>1 byte per 2×2 block</small></div></div>
  </div>
</div><div class="caption">1.5 bytes per pixel on average</div></div>`

// ---------- 05 samples ----------
const samples = (() => {
  const w = 1100, h = 430, mid = 200, amp = 112
  const f = x => Math.sin(x / 95) * 0.75 + Math.sin(x / 41 + 1.2) * 0.25
  const pts = []
  for (let x = 40; x <= w - 40; x += 4) pts.push(`${x},${(mid - amp * f(x)).toFixed(1)}`)
  const step = 48, dots = []
  for (let x = 64; x <= w - 60; x += step) dots.push(x)
  const labelled = new Set([1, 4, 8, 12, 16, 20])
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
    <text x="${w / 2}" y="${h - 14}" text-anchor="middle" font-family="DM Sans" font-size="24" fill="${colors.navy}" opacity=".65">one sample every 1/44 100 s · each sample is one number</text>
  </svg>`
})()

// ---------- 06 interleaved ----------
// real bytes of audio.raw one second in: xxd -s 176400 -l 12 audio.raw → 0ffe 9501 34fe fb01 5dfe 5602
const STEREO = [['0f', 'fe', -497], ['95', '01', 405], ['34', 'fe', -460], ['fb', '01', 507], ['5d', 'fe', -419], ['56', '02', 598]]
const interleaved = `<div class="samples">
  <div class="scells">${STEREO.map(([b0, b1, v], i) => `<div class="sample ${i % 2 ? 'r' : 'l'}">
    <div class="ch">${i % 2 ? 'R' : 'L'}</div>
    <div class="two"><div class="byte">${b0}</div><div class="byte">${b1}</div></div>
    <div class="val">${v < 0 ? '−' + (-v) : v}</div></div>`).join('')}</div>
  <div class="caps"><span>one sample = 2 bytes</span><span>stereo, interleaved</span></div>
</div>`

// ---------- 07 stream format cards ----------
const streamFormat = `<div class="pills">
  <div class="pill"><h3>Raw video</h3><div><b>width</b></div><div><b>height</b></div><div><b>pixel format</b></div></div>
  <div class="pill"><h3>Raw audio</h3><div><b>sample rate</b></div><div><b>sample format</b></div><div><b>channels</b></div></div>
</div>`

// ---------- 07a the sentence ----------
const sentence = `<div class="huge">Raw data doesn't describe itself.</div>`

// ---------- 08 pipeline ----------
const pipeline = (() => {
  const b = (t, sub) => box(t + (sub ? `<small>${sub}</small>` : ''))
  const video = vchain(stream('bbb_vp8.ivf'), b('File.Source'), b('IVF.Deserializer'), b('Transcoder', 'VP8 → raw video'), b('File.Sink'), stream('video.raw'))
  const audio = vchain(stream('bbb.mp3'), b('File.Source'), b('Transcoder', 'MP3 → raw audio'), b('File.Sink'), stream('audio.raw'))
  return `<div class="vcols top">${video}${audio}</div>`
})()

// ---------- 09 terminal ----------
const h = t => sp('hl', t)
const SIZES = [['bbb_vp8.ivf', '1 031 399'], ['video.raw', '157 852 800'], ['bbb.mp3', '529 492'], ['audio.raw', '5 833 728']]
const listing = `${sp('d', '$ ')}ls -l
${SIZES.map(([n, s]) => `${sp('d', '-rw-r--r--')}  ${s.padStart(11)}  ${n}`).join('\n')}`
const ffplayVideo = `${sp('d', '$ ')}ffplay ${h('-f rawvideo')} ${h('-pixel_format yuv420p')} ${h('-video_size 480x270')} ${h('-framerate 25')} video.raw`
const ffplayAudio = `${sp('d', '$ ')}ffplay ${h('-f s16le')} ${h('-ar 44100')} ${h('-ch_layout stereo')} audio.raw`
const terminalOne = `<div class="term">${listing}

${ffplayVideo}
${ffplayAudio}</div>`
const terminalSizes = `<div class="term">${listing}</div>`
const terminalFfplay = `<div class="term">${ffplayVideo}
${ffplayAudio}</div>`

// ---------- 10 takeaway ----------
const takeaway = `<div class="big">Raw data doesn't describe itself.</div>
<div class="big muted" style="margin-top:18px">Resolution and pixel format. Sample rate, sample format and channels.</div>`

const graphics = [
  ['01-hexdump', hexdump],
  ['02-rows-1', rows(1)], ['02-rows-2', rows(2)], ['02-rows-3', rows(3)],
  ['03-rgb', rgb],
  ['04-i420', i420],
  ['05-samples', samples],
  ['06-interleaved', interleaved],
  ['07-stream-format', streamFormat],
  ['07a-sentence', sentence],
  ['08-pipeline', pipeline],
  ['09-terminal', terminalOne],
  ['10-takeaway', takeaway],
]

render(graphics, OUT, null, css).then(() => {
  if (process.argv.includes('--preview')) {
    return render([
      ['09-terminal-A-one-panel', terminalOne],
      ['09-terminal-sizes', terminalSizes], ['09-terminal-ffplay', terminalFfplay],
    ], path.join(OUT, '_preview'), null, css)
  }
})
