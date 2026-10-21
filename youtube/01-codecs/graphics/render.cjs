// Overlay graphics for episode 01. See youtube/tools/overlays.cjs for the helpers and how to run.
const path = require('path')
const { arrow, box, stream, group, row, stack, chain, buildup, numbered, render } = require('../../tools/overlays.cjs')

const OUT = path.resolve(__dirname, '..', 'images')

const transcoding = (inp, dec, raw, enc, out, label = 'transcoding', hl = false) =>
  chain(stream(inp), group(label, chain(box(dec), stream(raw), box(enc)), hl), stream(out))

const video = (label, hl) => transcoding('VP8 stream', 'VP8<br>decoder', 'raw video<br>frames', 'H.264<br>encoder', 'H.264 stream', label, hl)
const audio = (label, hl) => transcoding('MP3 stream', 'MP3<br>decoder', 'raw audio<br>samples', 'AAC<br>encoder', 'AAC stream', label, hl)

const mathLines = [
  '1920 × 1080 = <b>2 073 600 pixels</b>',
  '× 3 bytes (red, green, blue) = <b>6.2 MB per frame</b>',
  '× 30 frames per second = <b>187 MB per second</b>',
  '× 2 hours = <b>1.3 TB</b>',
]
const math = n => buildup(mathLines, n)

const trickLines = ['Neighbour pixels are similar', 'Neighbour frames are similar', 'Human senses are not perfect']
const tricks = n => numbered(trickLines, n)

const graphics = [
  ['01-math-1', math(1)], ['01-math-2', math(2)], ['01-math-3', math(3)], ['01-math-4', math(4)],
  ['02-codec-diagram', chain(stream('raw media'), box('encoder'), stream('coded<br>stream'), box('decoder'), stream('raw media'))],
  ['03-compression-ratio', `<div class="huge">187 MB/s &nbsp;→&nbsp; 0.5 MB/s</div><div class="big muted" style="margin-top:18px">almost 400 times smaller</div>`],
  ['04-three-tricks-1', tricks(1)], ['04-three-tricks-2', tricks(2)], ['04-three-tricks-3', tricks(3)],
  ['07-codec-names', `<div class="pills">
      <div class="pill"><h3>Video</h3><div><b>H.264</b> · the most widely supported</div><div><b>VP8</b> · open, royalty-free, WebRTC</div><div><b>H.265, VP9, AV1</b> · newer, better compression</div></div>
      <div class="pill"><h3>Audio</h3><div><b>MP3</b> · the classic</div><div><b>AAC</b> · its successor, inside MP4</div><div><b>Opus</b> · live calls</div></div>
    </div>`],
  ['08-transcoding-video', video()],
  ['09-transcoding-audio', audio()],
  ['10-transcoding-both', stack(video(), audio())],
  ['11-raw-in-the-middle', `<div class="huge">In the middle,<br>you hold raw media.</div>`],
  ['12-pipeline-of-elements', chain(box('file source'), box('decoder'), box('encoder'), box('file sink')) + `<div class="caption">a pipeline: a chain of elements, each does one thing and passes the stream on</div>`],
  ['13-transcoder-is-the-box', audio('Membrane.Transcoder', true)],
  ['14-takeaway', `<div class="big">A codec is an encoder and a decoder.</div><div class="big" style="margin-top:14px">Raw media in the middle is where you work.</div>`],
]

render(graphics, OUT, async (browser, outDir) => {
  const skyPage = await browser.newPage({ deviceScaleFactor: 1, viewport: { width: 1920, height: 1080 } })
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
  await sky.screenshot({ path: path.join(outDir, '05-sky.png') })
  process.stdout.write('05-sky.png\n')
})
