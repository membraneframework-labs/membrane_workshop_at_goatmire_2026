// Shared renderer for episode overlay graphics.
//
// Every episode has graphics/render.cjs that builds a list of [name, html] pairs with the
// helpers below and calls render(). Output: transparent PNGs cropped to content, at 2x,
// in images/on-card/ and images/no-card/.
//
// Run from presentation/ so Playwright resolves:
//   cd presentation && NODE_PATH=node_modules node ../youtube/NN-slug/graphics/render.cjs
const { chromium } = require('playwright-chromium')
const path = require('path')
const fs = require('fs')

const SCALE = 2

// Membrane colours, same as presentation/style.css.
const colors = { navy: '#001a72', blue: '#87cce8', soft: '#e9f6fb', ink: '#0b1440' }

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
:root { --navy:${colors.navy}; --blue:${colors.blue}; --soft:${colors.soft}; --ink:${colors.ink}; }
html, body { margin:0; background:transparent; }
body { font-family:'DM Sans', sans-serif; color:var(--navy); padding:0; margin:0; }
.wrap { display:inline-block; padding:44px; }
.wrap.tight { padding:16px; }
.g { display:inline-block; }
.card { background:#fff; border-radius:28px; padding:44px 56px; box-shadow:0 10px 36px rgba(0,26,114,.18); }
.bare { padding:0; }

/* text */
.huge { font-size:64px; font-weight:700; line-height:1.25; text-align:center; white-space:nowrap; }
.big { font-size:44px; font-weight:600; line-height:1.4; text-align:center; white-space:nowrap; }
.muted { opacity:.75; }
.caption { margin-top:26px; font-size:24px; text-align:center; opacity:.65; }
.mono { font-family:'JetBrains Mono', monospace; font-variant-ligatures:none; }

/* lines that build up: same size in every step, hidden lines keep their space */
.math { font-size:40px; line-height:1.75; font-weight:500; white-space:nowrap; font-variant-numeric:tabular-nums; }
.math b { font-weight:700; }
.hidden { visibility:hidden; }

/* numbered list */
.list { font-size:40px; font-weight:500; line-height:1.3; }
.list > div { display:flex; align-items:center; margin:22px 0; white-space:nowrap; }
.list .n { flex:none; width:60px; height:60px; line-height:60px; border-radius:999px; background:var(--blue); text-align:center; font-weight:700; margin-right:24px; }

/* flow diagrams: solid boxes = processing, dashed parallelograms = streams/data */
.row { display:flex; align-items:center; gap:0; white-space:nowrap; }
.box, .stream { font-size:28px; line-height:1.25; text-align:center; padding:16px 26px; font-weight:500; }
.box { background:var(--blue); border:2px solid var(--navy); }
.box.plain { background:#fff; }
.box.hl { box-shadow:0 0 0 7px var(--soft), 0 0 0 11px var(--navy); }
.box.dim, .stream.dim { opacity:.35; }
.stream { border:2px dashed var(--navy); background:#fff; transform:skewX(-14deg); margin:0 8px; }
.stream > span { display:inline-block; transform:skewX(14deg); }
.arrow { width:52px; height:16px; flex:none; }
.group { position:relative; border:2px solid var(--navy); padding:58px 22px 22px; background:#fff; margin:0 4px; }
.group.hl { background:var(--soft); border-width:3px; }
.group::before { content:attr(data-label); position:absolute; top:14px; left:0; right:0; text-align:center; font-size:28px; color:var(--ink); }
.stack { display:flex; flex-direction:column; gap:40px; }

/* two or three cards side by side */
.pills { display:flex; gap:40px; }
.pill { background:var(--soft); border:2px solid var(--navy); border-radius:20px; padding:30px 38px; }
.pill h3 { margin:0 0 18px; font-size:24px; letter-spacing:.1em; text-transform:uppercase; font-weight:700; }
.pill div { font-size:28px; line-height:1.4; margin:8px 0; color:var(--ink); white-space:nowrap; }
.pill b { color:var(--navy); font-weight:700; }
`

const arrow = `<svg class="arrow" viewBox="0 0 52 16"><line x1="0" y1="8" x2="40" y2="8" stroke="${colors.navy}" stroke-width="2"/><polygon points="38,2 52,8 38,14" fill="${colors.navy}"/></svg>`
const box = (t, cls = '') => `<div class="box ${cls}">${t}</div>`
const stream = t => `<div class="stream"><span>${t}</span></div>`
const group = (label, inner, hl = false) => `<div class="group${hl ? ' hl' : ''}" data-label="${label}"><div class="row">${inner}</div></div>`
const row = (...parts) => `<div class="row">${parts.join('')}</div>`
const stack = (...parts) => `<div class="stack">${parts.join('')}</div>`
// A chain of items joined by arrows: chain(stream('a'), box('b'), stream('c'))
const chain = (...parts) => row(parts.join(arrow))
// Build-up: lines[0..n) visible, the rest keep their space. cls: 'math' or 'list'.
const buildup = (lines, n, cls = 'math') =>
  `<div class="${cls}">${lines.map((l, i) => `<div class="${i < n ? '' : 'hidden'}">${l}</div>`).join('')}</div>`
const numbered = (lines, n) =>
  `<div class="list">${lines.map((l, i) => `<div class="${i < n ? '' : 'hidden'}"><span class="n">${i + 1}</span>${l}</div>`).join('')}</div>`

async function render(graphics, outDir, extra, extraCss = '') {
  const browser = await chromium.launch()
  const page = await browser.newPage({ deviceScaleFactor: SCALE, viewport: { width: 2400, height: 1600 } })
  for (const variant of ['on-card', 'no-card']) {
    fs.mkdirSync(path.join(outDir, variant), { recursive: true })
    for (const [name, html] of graphics) {
      await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}${extraCss}</style></head>
        <body><div class="wrap ${variant === 'on-card' ? '' : 'tight'}"><div class="g ${variant === 'on-card' ? 'card' : 'bare'}">${html}</div></div></body></html>`)
      await page.evaluate(() => document.fonts.ready)
      const el = await page.$('.wrap')
      await el.screenshot({ path: path.join(outDir, variant, `${name}.png`), omitBackground: true })
      process.stdout.write(`${variant}/${name}.png\n`)
    }
  }
  if (extra) await extra(browser, outDir)
  await browser.close()
}

module.exports = { colors, css, arrow, box, stream, group, row, stack, chain, buildup, numbered, render }
