// Renders the episode's overlay graphics as transparent PNGs.
// Run from presentation/ (for its node_modules):
//   NODE_PATH=node_modules node ../youtube/01-codecs/graphics/render.cjs
const { chromium } = require('playwright-chromium')
const path = require('path')
const fs = require('fs')

const OUT = path.resolve(__dirname, '..', 'images')
const SCALE = 2

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
:root { --navy:#001a72; --blue:#87cce8; --soft:#e9f6fb; --ink:#0b1440; }
html, body { margin:0; background:transparent; }
body { font-family:'DM Sans', sans-serif; color:var(--navy); padding:40px; display:inline-block; }
.g { display:inline-block; }
.card { background:#fff; border-radius:28px; padding:44px 56px; box-shadow:0 10px 36px rgba(0,26,114,.18); }
.bare { padding:0; }

.math { font-size:40px; line-height:1.75; font-weight:500; white-space:nowrap; font-variant-numeric:tabular-nums; }
.math b { font-weight:700; }
.hidden { visibility:hidden; }

.row { display:flex; align-items:center; gap:0; white-space:nowrap; }
.box, .stream { font-size:28px; line-height:1.25; text-align:center; padding:16px 26px; font-weight:500; }
.box { background:var(--blue); border:2px solid var(--navy); }
.stream { border:2px dashed var(--navy); background:#fff; transform:skewX(-14deg); margin:0 8px; }
.stream > span { display:inline-block; transform:skewX(14deg); }
.arrow { width:52px; height:16px; flex:none; }
.group { position:relative; border:2px solid var(--navy); padding:58px 22px 22px; background:#fff; margin:0 4px; }
.group.hl { background:var(--soft); border-width:3px; }
.group::before { content:attr(data-label); position:absolute; top:14px; left:0; right:0; text-align:center; font-size:28px; color:var(--ink); }
.stack { display:flex; flex-direction:column; gap:40px; }

.huge { font-size:64px; font-weight:700; line-height:1.25; text-align:center; white-space:nowrap; }
.big { font-size:44px; font-weight:600; line-height:1.4; text-align:center; white-space:nowrap; }
.muted { opacity:.75; }

.list { font-size:40px; font-weight:500; line-height:1.3; }
.list > div { display:flex; align-items:center; margin:22px 0; white-space:nowrap; }
.list .n { flex:none; width:60px; height:60px; line-height:60px; border-radius:999px; background:var(--blue); text-align:center; font-weight:700; margin-right:24px; }

.pills { display:flex; gap:40px; }
.pill { background:var(--soft); border:2px solid var(--navy); border-radius:20px; padding:30px 38px; }
.pill h3 { margin:0 0 18px; font-size:24px; letter-spacing:.1em; text-transform:uppercase; font-weight:700; }
.pill div { font-size:28px; line-height:1.4; margin:8px 0; color:var(--ink); white-space:nowrap; }
.pill b { color:var(--navy); font-weight:700; }
.caption { margin-top:26px; font-size:24px; text-align:center; opacity:.65; }
`

const arrow = `<svg class="arrow" viewBox="0 0 52 16"><line x1="0" y1="8" x2="40" y2="8" stroke="#001a72" stroke-width="2"/><polygon points="38,2 52,8 38,14" fill="#001a72"/></svg>`
const box = t => `<div class="box">${t}</div>`
const stream = t => `<div class="stream"><span>${t}</span></div>`
const group = (label, inner, hl = false) => `<div class="group${hl ? ' hl' : ''}" data-label="${label}"><div class="row">${inner}</div></div>`

const transcoding = (inp, dec, raw, enc, out, label = 'transcoding', hl = false) =>
  `<div class="row">${stream(inp)}${arrow}${group(label, `${box(dec)}${arrow}${stream(raw)}${arrow}${box(enc)}`, hl)}${arrow}${stream(out)}</div>`

const video = (label, hl) => transcoding('VP8 stream', 'VP8<br>decoder', 'raw video<br>frames', 'H.264<br>encoder', 'H.264 stream', label, hl)
const audio = (label, hl) => transcoding('MP3 stream', 'MP3<br>decoder', 'raw audio<br>samples', 'AAC<br>encoder', 'AAC stream', label, hl)

const mathLines = [
  '1920 × 1080 = <b>2 073 600 pixels</b>',
  '× 3 bytes (red, green, blue) = <b>6.2 MB per frame</b>',
  '× 30 frames per second = <b>187 MB per second</b>',
  '× 2 hours = <b>1.3 TB</b>',
]
const math = n => `<div class="math">${mathLines.map((l, i) => `<div class="${i < n ? '' : 'hidden'}">${l}</div>`).join('')}</div>`

const trickLines = ['Neighbour pixels are similar', 'Neighbour frames are similar', 'Human senses are not perfect']
const tricks = n => `<div class="list">${trickLines.map((l, i) => `<div class="${i < n ? '' : 'hidden'}"><span class="n">${i + 1}</span>${l}</div>`).join('')}</div>`

const graphics = [
  ['01-math-1', math(1)], ['01-math-2', math(2)], ['01-math-3', math(3)], ['01-math-4', math(4)],
  ['02-codec-diagram', `<div class="row">${stream('raw media')}${arrow}${box('encoder')}${arrow}${stream('coded<br>stream')}${arrow}${box('decoder')}${arrow}${stream('raw media')}</div>`],
  ['03-compression-ratio', `<div class="huge">187 MB/s &nbsp;→&nbsp; 0.5 MB/s</div><div class="big muted" style="margin-top:18px">almost 400 times smaller</div>`],
  ['04-three-tricks-1', tricks(1)], ['04-three-tricks-2', tricks(2)], ['04-three-tricks-3', tricks(3)],
  ['07-codec-names', `<div class="pills">
      <div class="pill"><h3>Video</h3><div><b>H.264</b> · the most widely supported</div><div><b>VP8</b> · open, royalty-free, WebRTC</div><div><b>H.265, VP9, AV1</b> · newer, better compression</div></div>
      <div class="pill"><h3>Audio</h3><div><b>MP3</b> · the classic</div><div><b>AAC</b> · its successor, inside MP4</div><div><b>Opus</b> · live calls</div></div>
    </div>`],
  ['08-transcoding-video', video()],
  ['09-transcoding-audio', audio()],
  ['10-transcoding-both', `<div class="stack">${video()}${audio()}</div>`],
  ['11-raw-in-the-middle', `<div class="huge">In the middle,<br>you hold raw media.</div>`],
  ['12-pipeline-of-elements', `<div class="row">${box('file source')}${arrow}${box('decoder')}${arrow}${box('encoder')}${arrow}${box('file sink')}</div><div class="caption">a pipeline: a chain of elements, each does one thing and passes the stream on</div>`],
  ['13-transcoder-is-the-box', audio('Membrane.Transcoder', true)],
  ['14-takeaway', `<div class="big">A codec is an encoder and a decoder.</div><div class="big" style="margin-top:14px">Raw media in the middle is where you work.</div>`],
]

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ deviceScaleFactor: SCALE, viewport: { width: 2400, height: 1600 } })
  const skyPage = await browser.newPage({ deviceScaleFactor: 1, viewport: { width: 1920, height: 1080 } })
  for (const variant of ['on-card', 'no-card']) {
    fs.mkdirSync(path.join(OUT, variant), { recursive: true })
    for (const [name, html] of graphics) {
      await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
        <body><div class="g ${variant === 'on-card' ? 'card' : 'bare'}">${html}</div></body></html>`)
      await page.evaluate(() => document.fonts.ready)
      const el = await page.$('.g')
      await el.screenshot({ path: path.join(OUT, variant, `${name}.png`), omitBackground: true })
      process.stdout.write(`${variant}/${name}.png\n`)
    }
  }
  // 05: a blue sky with cumulus clouds, drawn from fractal noise so it carries no licence. Full frame.
  await skyPage.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0}</style></head>
  <body><canvas class="sky" width="1920" height="1080"></canvas><script>
    const W = 1920, H = 1080
    const ctx = document.querySelector('canvas').getContext('2d')
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#2b6fcf'); g.addColorStop(0.55, '#5da3e8'); g.addColorStop(1, '#bfe0f8')
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)

    let seed = 20261019
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
    const N = 256, grid = new Float32Array(N * N)
    for (let i = 0; i < N * N; i++) grid[i] = rnd()
    const fade = t => t * t * (3 - 2 * t)
    function noise(x, y) {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi
      const X = xi & (N - 1), Y = yi & (N - 1), X1 = (X + 1) & (N - 1), Y1 = (Y + 1) & (N - 1)
      const a = grid[Y * N + X], b = grid[Y * N + X1], c = grid[Y1 * N + X], d = grid[Y1 * N + X1]
      const u = fade(xf), v = fade(yf)
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
    }
    function fbm(x, y) {
      let s = 0, amp = 0.5, f = 1, n = 0
      for (let o = 0; o < 7; o++) { s += amp * noise(x * f, y * f); n += amp; amp *= 0.52; f *= 2.07 }
      return s / n
    }
    const clamp = v => v < 0 ? 0 : v > 1 ? 1 : v
    const img = ctx.getImageData(0, 0, W, H), d = img.data
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const nx = x / 640 + 3.7, ny = y / 300 + 1.9
        // big cumulus masses, flatter than tall
        const v = fbm(nx, ny)
        const cover = 0.585 + 0.07 * (1 - y / H)           // fewer clouds high up
        let dens = clamp((v - cover) / 0.085)
        dens = dens * dens * (3 - 2 * dens)
        if (dens === 0) continue
        // lit top, shaded underside
        const above = fbm(nx, ny - 0.045)
        const light = clamp((v - above) * 9 + 0.55)
        const shade = 0.72 + 0.30 * light
        const i = (y * W + x) * 4
        const cr = 255 * shade, cg = 255 * Math.min(1, shade + 0.01), cb = 255 * Math.min(1, shade + 0.05)
        d[i]     += (cr - d[i]) * dens
        d[i + 1] += (cg - d[i + 1]) * dens
        d[i + 2] += (cb - d[i + 2]) * dens
      }
    }
    ctx.putImageData(img, 0, 0)
  </script></body></html>`)
  const sky = await skyPage.$('.sky')
  await sky.screenshot({ path: path.join(OUT, '05-sky.png') })
  process.stdout.write('05-sky.png\n')
  await browser.close()
})()
