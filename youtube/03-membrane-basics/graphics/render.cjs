// Overlay graphics for episode 03 (Membrane basics). See youtube/tools/overlays.cjs for the helpers.
// Run:  cd presentation && NODE_PATH=node_modules node ../youtube/03-membrane-basics/graphics/render.cjs
// Add --preview to also render the alternatives for 02-processes and 03-three-kinds into images/_preview/.
const path = require('path')
const { colors, box, arrow, varrow, vsplit, vchain, render } = require('../../tools/overlays.cjs')

const OUT = path.resolve(__dirname, '..', 'images')

// ---------- episode-specific styles ----------
const css = `
/* the player as processes: variant B draws the slide's circles instead of boxes */
.procs .vcols > .vcol { width:360px; }
.circ { width:240px; height:240px; border-radius:50%; background:var(--blue); border:2px solid var(--navy); box-sizing:border-box;
        display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;
        font-size:28px; line-height:1.25; font-weight:500; }
.circ small, .box small.mono { display:block; font-size:19px; font-weight:400; opacity:.8; margin-top:6px; }
.box small.mono { font-size:20px; }

/* an element tile with its pads drawn as stubs */
.el { position:relative; width:300px; height:112px; box-sizing:border-box; background:var(--blue); border:2px solid var(--navy);
      display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:500; }
.pad { position:absolute; top:50%; width:26px; height:26px; margin-top:-13px; background:#fff; border:2px solid var(--navy); box-sizing:border-box; }
.pad.in { left:-14px; } .pad.out { right:-14px; }
.pad i { position:absolute; top:32px; left:50%; transform:translateX(-50%); font-style:normal; font-size:21px; font-weight:500;
         color:var(--navy); white-space:nowrap; font-family:'JetBrains Mono', monospace; font-variant-ligatures:none; background:#fff; padding:0 5px; }

/* three kinds, stacked top to bottom; inputs and outputs drawn as arrows, no captions.
   A: vertical arrows (in from above, out below). B: horizontal arrows (in from the left, out to the right). */
.kinds { display:flex; flex-direction:column; align-items:center; gap:56px; }
.kind { display:grid; grid-template-columns:300px; justify-items:center; }
.kind .varrow.in { grid-row:1; } .kind .el { grid-row:2; } .kind .varrow.out { grid-row:3; }
.kinds.h { gap:40px; }
.kinds.h .kind { grid-template-columns:52px 300px 52px; align-items:center; }
.kinds.h .arrow.in { grid-column:1; } .kinds.h .el { grid-column:2; grid-row:1; } .kinds.h .arrow.out { grid-column:3; }
.kinds .el { width:300px; }

/* two elements joined through pads */
.padrow { display:flex; align-items:center; padding-bottom:10px; }
.link { position:relative; width:300px; height:16px; margin:0 28px; }
.link svg { display:block; }
.link .fmt { position:absolute; left:0; right:0; bottom:24px; text-align:center; font-size:26px; font-weight:600; white-space:nowrap; }

/* the core and the plugins */
.pkgs { display:flex; align-items:center; gap:56px; }
.core { display:flex; flex-direction:column; align-items:center; }
.core .box { width:300px; height:112px; box-sizing:border-box; display:flex; align-items:center; justify-content:center;
             background:var(--navy); color:#fff; font-family:'JetBrains Mono', monospace; font-variant-ligatures:none; font-size:27px; }
.core .cap { margin-top:16px; font-size:22px; color:var(--ink); opacity:.75; white-space:nowrap; text-align:center; width:300px; }
.plugins { position:relative; border:2px solid var(--navy); background:#fff; padding:60px 24px 24px;
           display:grid; grid-template-columns:repeat(2, 1fr); gap:18px; }
.plugins::before { content:attr(data-label); position:absolute; top:14px; left:0; right:0; text-align:center; font-size:26px; color:var(--ink); }
.plug { background:var(--soft); border:2px solid var(--navy); border-radius:14px; padding:14px 22px; min-width:256px; box-sizing:border-box; white-space:nowrap; }
.plug h4 { margin:0; font-size:26px; font-weight:600; }
.plug div { margin-top:4px; font-size:20px; color:var(--ink); font-family:'JetBrains Mono', monospace; font-variant-ligatures:none; }
.plug.more { grid-column:1 / -1; border-style:dashed; display:flex; align-items:center; justify-content:center; padding:10px 22px; }
.plug.more h4 { font-size:34px; letter-spacing:.2em; }
`

// ---------- helpers ----------
const withClass = (svg, cls) => cls ? svg.replace(/class="(\w+)"/, `class="$1 ${cls}"`) : svg
const vcols = (...cols) => `<div class="vcols">${cols.join('')}</div>`
const PIDS = ['#PID&lt;0.101.0&gt;', '#PID&lt;0.102.0&gt;', '#PID&lt;0.103.0&gt;', '#PID&lt;0.104.0&gt;', '#PID&lt;0.105.0&gt;', '#PID&lt;0.106.0&gt;']

// ---------- 01 the player as boxes, built up in six steps; 02 the same with every box a process ----------
// n = steps shown (1..6); hidden steps keep their place so all six PNGs have the same size.
// pid: false = plain, 'line' = PID as a second line in each box, 'circle' = the slide's circles.
const STEPS = [['Read the file', 1], ['Split into tracks', 2], ['Decode video', 3], ['Decode audio', 4], ['Screen', 5], ['Speakers', 6]]
// the split arrow: the left arm appears with step 3, the right arm with step 4
const splitSteps = n => {
  let s = withClass(vsplit, n >= 3 ? '' : 'hidden')
  if (n < 4) s = s.replace('<path d="M225,0 C225,40 450,30 450,66"', '<path class="hidden" d="M225,0 C225,40 450,30 450,66"')
                .replace('<polygon points="444,66 450,80 456,66"', '<polygon class="hidden" points="444,66 450,80 456,66"')
  return s
}
const player = (n, pid = false) => {
  const h = s => s <= n ? '' : 'hidden'
  const tile = i => {
    const [label, s] = STEPS[i]
    if (pid === 'circle') return `<div class="circ ${h(s)}">${label}<small class="mono">${PIDS[i]}</small></div>`
    return box(label + (pid ? `<small class="mono">${PIDS[i]}</small>` : ''), h(s))
  }
  const a = s => withClass(varrow, h(s))
  const top = `<div class="vcol">${tile(0)}${a(2)}${tile(1)}</div>`
  const branches = vcols(`<div class="vcol">${tile(2)}${a(5)}${tile(4)}</div>`, `<div class="vcol">${tile(3)}${a(6)}${tile(5)}</div>`)
  return `<div class="${pid === 'circle' ? 'procs' : ''}"><div class="vcol">${top}${splitSteps(n)}${branches}</div></div>`
}

// ---------- 03 three kinds of elements ----------
// Each kind is a tile with an arrow in and/or an arrow out. horizontal = variant B.
const kind = (name, pads, horizontal = false) => {
  const a = horizontal ? arrow : varrow
  return `<div class="kind">
  ${pads.includes('in') ? withClass(a, 'in') : ''}
  <div class="el">${name}</div>
  ${pads.includes('out') ? withClass(a, 'out') : ''}
</div>`
}
const threeKinds = (horizontal = false) => `<div class="kinds ${horizontal ? 'h' : ''}">
  ${kind('Source', ['out'], horizontal)}
  ${kind('Filter', ['in', 'out'], horizontal)}
  ${kind('Sink', ['in'], horizontal)}
</div>`

// ---------- 04 pads ----------
const link = fmt => `<div class="link"><span class="fmt">${fmt}</span>
  <svg width="300" height="16" viewBox="0 0 300 16"><line x1="0" y1="8" x2="288" y2="8" stroke="${colors.navy}" stroke-width="2"/><polygon points="286,2 300,8 286,14" fill="${colors.navy}"/></svg></div>`
const pads = `<div class="padrow">
  <div class="el">MP3 decoder<span class="pad out"><i>output</i></span></div>
  ${link('uncompressed audio')}
  <div class="el">Audio sink<span class="pad in"><i>input</i></span></div>
</div>`

// ---------- 05 the core and the plugins ----------
const plug = (name, mods) => `<div class="plug"><h4>${name}</h4><div>${mods}</div></div>`
const plugins = `<div class="pkgs">
  <div class="core">${box('membrane_core')}<div class="cap">runs pipelines,<br>elements and pads</div></div>
  <div class="plugins" data-label="plugins, one package each">
    ${plug('file plugin', 'File.Source · File.Sink')}
    ${plug('MP4 plugin', 'Muxer · Demuxer')}
    ${plug('H.264 plugin', '')}
    ${plug('WebRTC plugin', '')}
    <div class="plug more"><h4>…</h4></div>
  </div>
</div>`

// ---------- 06 the example pipeline, each element highlighted in turn ----------
const pipeline = hl => {
  const b = (t, key) => box(t, key === hl ? 'hl' : '')
  return `<div class="${hl ? 'hlC' : ''}">${vchain(b('File source', 'src'), b('MP3 decoder', 'dec'), b('Audio sink', 'sink'))}</div>`
}

// ---------- 07 takeaway ----------
const takeaway = `<div class="big">Media processing is a graph of small steps.</div>
<div class="big" style="margin-top:14px">In Membrane, every element is a separate process.</div>`

const graphics = [
  ['01-player-1', player(1)], ['01-player-2', player(2)], ['01-player-3', player(3)], ['01-player-4', player(4)], ['01-player-5', player(5)], ['01-player-6', player(6)],
  ['02-processes', player(6, 'line')],
  ['03-three-kinds', threeKinds()],
  ['04-pads', pads],
  ['05-plugins', plugins],
  ['06-pipeline-1', pipeline(null)], ['06-pipeline-2', pipeline('src')], ['06-pipeline-3', pipeline('dec')], ['06-pipeline-4', pipeline('sink')],
  ['07-takeaway', takeaway],
]

render(graphics, OUT, null, css).then(() => {
  if (process.argv.includes('--preview')) {
    return render([['02-processes-A-pid-lines', player(6, 'line')], ['02-processes-B-circles', player(6, 'circle')],
      ['03-three-kinds-A-vertical-arrows', threeKinds()], ['03-three-kinds-B-horizontal-arrows', threeKinds(true)]],
      path.join(OUT, '_preview'), null, css)
  }
})
