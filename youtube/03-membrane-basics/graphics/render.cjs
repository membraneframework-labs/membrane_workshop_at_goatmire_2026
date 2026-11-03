// Overlay graphics for episode 03 (Membrane basics). See youtube/tools/overlays.cjs for the helpers.
// Run:  cd presentation && NODE_PATH=node_modules node ../youtube/03-membrane-basics/graphics/render.cjs
const path = require('path')
const { colors, box, varrow, vsplit, vchain, render } = require('../../tools/overlays.cjs')

const OUT = path.resolve(__dirname, '..', 'images')

// ---------- episode-specific styles ----------
const css = `
/* 02 and 03: the player graph inside a labelled frame ("Membrane runs it", then "pipeline") */
.group.framed { padding:70px 60px 32px; margin:0; }
.group.framed::before { font-size:30px; font-weight:600; }
/* 03: one box tagged "element" */
.tagged { position:relative; }
.tagged .tag { position:absolute; left:100%; top:50%; transform:translateY(-50%); margin-left:22px; white-space:nowrap;
               font-size:24px; font-weight:600; color:var(--navy); display:flex; align-items:center; }
.tagged .tag::before { content:''; display:inline-block; width:24px; height:2px; background:var(--navy); margin-right:8px; }

/* an element tile with its pads drawn as stubs */
.el { position:relative; width:360px; height:112px; box-sizing:border-box; background:var(--blue); border:2px solid var(--navy);
      display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:500; }
.pad { position:absolute; top:50%; width:26px; height:26px; margin-top:-13px; background:#fff; border:2px solid var(--navy); box-sizing:border-box; }
.pad.in { left:-14px; } .pad.out { right:-14px; }
.pad i { position:absolute; top:32px; left:50%; transform:translateX(-50%); font-style:normal; font-size:21px; font-weight:500;
         color:var(--navy); white-space:nowrap; font-family:'JetBrains Mono', monospace; font-variant-ligatures:none; background:#fff; padding:0 5px; }

/* three kinds, stacked top to bottom; inputs and outputs drawn as arrows, no captions.
   The author chose vertical arrows (in from above, out below) and asked for them a little thicker. */
.kinds { display:flex; flex-direction:column; align-items:center; gap:56px; }
.kind { display:grid; grid-template-columns:360px; justify-items:center; }
.kind .varrow.in { grid-row:1; } .kind .el { grid-row:2; } .kind .varrow.out { grid-row:3; }
.kinds .el { width:360px; }

/* two elements stacked, joined through pads: the output pad on the bottom edge of the upper element,
   the input pad on the top edge of the lower one, a vertical link between them, labels to the right */
.vpads { display:flex; flex-direction:column; align-items:center; padding-right:116px; }  /* room for the labels, which are positioned absolutely and add no width */
.pad.bot, .pad.top { left:50%; margin-left:-13px; margin-top:0; top:auto; }
.pad.bot { bottom:-14px; } .pad.top { top:-14px; }
.vlink { position:relative; width:16px; height:170px; margin:14px 0; }
.vlink svg { display:block; }
.vlink .fmt, .vlink .pn { position:absolute; left:40px; white-space:nowrap; }
.vlink .fmt { top:50%; transform:translateY(-50%); font-size:26px; font-weight:600; }
.vlink .pn { font-family:'JetBrains Mono', monospace; font-variant-ligatures:none; font-size:21px; font-weight:500; }
.vlink .pn.a { top:-6px; } .vlink .pn.b { bottom:-6px; }

/* the core and the plugins */
.pkgs { display:flex; align-items:center; gap:56px; }
.core { display:flex; flex-direction:column; align-items:center; }
.core .box { width:360px; height:112px; box-sizing:border-box; display:flex; align-items:center; justify-content:center;
             background:var(--navy); color:#fff; font-family:'JetBrains Mono', monospace; font-variant-ligatures:none; font-size:27px; }
.core .cap { margin-top:16px; font-size:22px; color:var(--ink); opacity:.75; white-space:nowrap; text-align:center; width:360px; }
.plugins { position:relative; border:2px solid var(--navy); background:#fff; padding:60px 24px 24px;
           display:grid; grid-template-columns:repeat(2, 1fr); grid-template-rows:1fr 1fr auto; gap:18px; }
.plugins::before { content:attr(data-label); position:absolute; top:14px; left:0; right:0; text-align:center; font-size:26px; color:var(--ink); }
.plug { background:var(--soft); border:2px solid var(--navy); border-radius:14px; padding:14px 22px; min-width:256px; box-sizing:border-box; white-space:nowrap;
        display:flex; flex-direction:column; justify-content:center; }
.plug h4 { margin:0; font-size:26px; font-weight:600; }
.plug div { margin-top:4px; font-size:21px; color:var(--ink); }
.plug.more { grid-column:1 / -1; border-style:dashed; display:flex; align-items:center; justify-content:center; padding:10px 22px; }
.plug.more h4 { font-size:34px; letter-spacing:.2em; }
`

// ---------- helpers ----------
const withClass = (svg, cls) => cls ? svg.replace(/class="(\w+)"/, `class="$1 ${cls}"`) : svg
const vcols = (...cols) => `<div class="vcols">${cols.join('')}</div>`

// ---------- 01 the player as boxes, built up in six steps ----------
// n = steps shown (1..6); hidden steps keep their place so all six PNGs have the same size.
// tagIndex: one tile gets a small tag beside it (used by 03-pipeline-and-elements).
const STEPS = [['Read the file', 1], ['Split into tracks', 2], ['Decode video', 3], ['Decode audio', 4], ['Screen', 5], ['Speakers', 6]]
// the split arrow: the left arm appears with step 3, the right arm with step 4
const splitSteps = n => {
  let s = withClass(vsplit, n >= 3 ? '' : 'hidden')
  if (n < 4) s = s.replace('<path d="M225,0 C225,40 450,30 450,66"', '<path class="hidden" d="M225,0 C225,40 450,30 450,66"')
                .replace('<polygon points="444,66 450,80 456,66"', '<polygon class="hidden" points="444,66 450,80 456,66"')
  return s
}
const player = (n, tagIndex = -1, tagText = 'element') => {
  const h = s => s <= n ? '' : 'hidden'
  const tile = i => {
    const [label, s] = STEPS[i]
    const b = box(label, h(s))
    return i === tagIndex ? `<div class="tagged">${b}<span class="tag">${tagText}</span></div>` : b
  }
  const a = s => withClass(varrow, h(s))
  const top = `<div class="vcol">${tile(0)}${a(2)}${tile(1)}</div>`
  const branches = vcols(`<div class="vcol">${tile(2)}${a(5)}${tile(4)}</div>`, `<div class="vcol">${tile(3)}${a(6)}${tile(5)}</div>`)
  return `<div class="vcol">${top}${splitSteps(n)}${branches}</div>`
}

// ---------- 02, 03: the graph framed ----------
const framed = (label, inner) => `<div class="group framed" data-label="${label}">${inner}</div>`
const membraneRunsIt = framed('Membrane runs it', player(6))
const pipelineAndElements = framed('pipeline', player(6, 0))  // the tag sits beside the top box, inside the frame

// ---------- 04 three kinds of elements ----------
// Each kind is a tile with an arrow in and/or an arrow out; the stubs are thicker than pipeline arrows.
const thickArrow = `<svg class="varrow" viewBox="0 0 16 40"><line x1="8" y1="0" x2="8" y2="26" stroke="${colors.navy}" stroke-width="3.5"/><polygon points="0,24 8,40 16,24" fill="${colors.navy}"/></svg>`
const kind = (name, pads) => `<div class="kind">
  ${pads.includes('in') ? withClass(thickArrow, 'in') : ''}
  <div class="el">${name}</div>
  ${pads.includes('out') ? withClass(thickArrow, 'out') : ''}
</div>`
const threeKinds = () => `<div class="kinds">
  ${kind('Source', ['out'])}
  ${kind('Filter', ['in', 'out'])}
  ${kind('Sink', ['in'])}
</div>`

// ---------- 05 pads ----------
// pad names sit beside the link, next to the pad square they name, so they never cross a box border
const vlink = (fmt, a, b) => `<div class="vlink"><span class="pn a">${a}</span><span class="fmt">${fmt}</span><span class="pn b">${b}</span>
  <svg width="16" height="170" viewBox="0 0 16 170"><line x1="8" y1="0" x2="8" y2="158" stroke="${colors.navy}" stroke-width="2"/><polygon points="2,156 8,170 14,156" fill="${colors.navy}"/></svg></div>`
const pads = `<div class="vpads">
  <div class="el">MP3 decoder<span class="pad bot"></span></div>
  ${vlink('uncompressed audio', 'output', 'input')}
  <div class="el">Audio sink<span class="pad top"></span></div>
</div>`

// ---------- 06 the core and the plugins ----------
const plug = (name, mods) => `<div class="plug"><h4>${name}</h4>${mods ? `<div>${mods}</div>` : ''}</div>`
const plugins = `<div class="pkgs">
  <div class="core">${box('membrane_core')}<div class="cap">runs pipelines,<br>elements and pads</div></div>
  <div class="plugins" data-label="plugins, usually one package per domain">
    ${plug('File plugin', 'file source · file sink')}
    ${plug('MP4 plugin', 'muxer · demuxer')}
    ${plug('H.264 plugin', '')}
    ${plug('WebRTC plugin', '')}
    <div class="plug more"><h4>…</h4></div>
  </div>
</div>`

// ---------- 07 the example pipeline, each element highlighted in turn ----------
const pipeline = hl => {
  const b = (t, key) => box(t, key === hl ? 'hl' : '')
  return `<div class="${hl ? 'hlC' : ''}">${vchain(b('File source', 'src'), b('MP3 decoder', 'dec'), b('Audio sink', 'sink'))}</div>`
}

// ---------- 08 takeaway ----------
const takeaway = `<div class="big muted" style="font-weight:500">Media processing is a graph of small steps.</div>
<div class="big" style="margin-top:14px">You describe the graph, and Membrane runs it.</div>`

const graphics = [
  ['01-player-1', player(1)], ['01-player-2', player(2)], ['01-player-3', player(3)], ['01-player-4', player(4)], ['01-player-5', player(5)], ['01-player-6', player(6)],
  ['02-membrane-runs-it', membraneRunsIt],
  ['03-pipeline-and-elements', pipelineAndElements],
  ['04-three-kinds', threeKinds()],
  ['05-pads', pads],
  ['06-plugins', plugins],
  ['07-pipeline-1', pipeline(null)], ['07-pipeline-2', pipeline('src')], ['07-pipeline-3', pipeline('dec')], ['07-pipeline-4', pipeline('sink')],
  ['08-takeaway', takeaway],
]

render(graphics, OUT, null, css)
