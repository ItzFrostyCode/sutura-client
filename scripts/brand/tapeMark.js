// SUTURA "S-Tape & Needle" mark — traced by hand (3 passes, overlay-checked) over the owner's Gemini concept board,
// docs/brand/concept-reference.png. Drawn in that crop's 4x space (912 x 864). Plain SVG: strokes, one even-odd needle.
//
// mark(palette, { detail, gap, id }) returns the inner SVG.
//   palette: line (outline, needle, thread), mark (ticks, metal tips, fold), fill (tape), shade (twist strip)
//   detail:  'full' (>= 48px) or 'small' (< 48px): the same drawing — tape, tips, needle, thread, bow — with heavier
//            lines and without the ticks, rivet holes and twist strip, which are under a pixel at those sizes
//   gap:     { halo: colour } paints the gap round the needle (in-app: the page colour, no ids needed)
//            'mask' cuts it out (standalone files: transparent on any background)
//   mono:    one colour; the tape is drawn as an outline only
const f = (n) => Math.round(n * 10) / 10;

const PTS = [[630,280],[562,228],[470,218],[378,240],[314,298],[314,362],[378,414],[478,454],[566,500],[606,566],[576,642],[480,682],[378,674],[266,614]];
const W = 76, O = 10;

function catmull(pts) {
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? pts[i + 1];
    segs.push([p1, [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6], p2]);
  }
  return segs;
}
const SEGS = catmull(PTS);
const D = `M${SEGS[0][0].map(f)}` + SEGS.map((s) => `C${s[1].map(f)} ${s[2].map(f)} ${s[3].map(f)}`).join('');
const bez = (s, t) => { const u = 1 - t; return [0, 1].map((k) => u*u*u*s[0][k] + 3*u*u*t*s[1][k] + 3*u*t*t*s[2][k] + t*t*t*s[3][k]); };
const SAMPLES = [];
let L = 0, prev = null;
SEGS.forEach((s) => { for (let i = 0; i <= 200; i++) { const p = bez(s, i / 200); if (prev) L += Math.hypot(p[0]-prev[0], p[1]-prev[1]); SAMPLES.push({ p, s: L }); prev = p; } });
SAMPLES.forEach((m, i) => { const a = SAMPLES[Math.max(0, i-2)].p, b = SAMPLES[Math.min(SAMPLES.length-1, i+2)].p; const dx = b[0]-a[0], dy = b[1]-a[1], n = Math.hypot(dx, dy) || 1; m.t = [dx/n, dy/n]; m.n = [dy/n, -dx/n]; });
const at = (s) => SAMPLES.reduce((best, m) => Math.abs(m.s - s) < Math.abs(best.s - s) ? m : best);
const off = (m, d) => [m.p[0] + m.n[0]*d, m.p[1] + m.n[1]*d];
const run = (s1, s2, d = 0) => { const pts = SAMPLES.filter((m) => m.s >= s1 && m.s <= s2).filter((_, i) => i % 4 === 0).map((m) => off(m, d).map(f)); return `M${pts.join('L')}`; };

const E = [218, 164], T = [410, 320];
const NANG = Math.atan2(T[1] - E[1], T[0] - E[0]), NLEN = Math.hypot(T[0] - E[0], T[1] - E[1]);
const nearNeedle = (q) => { const ux = Math.cos(NANG), uy = Math.sin(NANG); const t = Math.max(0, Math.min(NLEN, (q[0]-E[0])*ux + (q[1]-E[1])*uy)); return Math.hypot(q[0] - (E[0] + ux*t), q[1] - (E[1] + uy*t)) < 34; };
const NEEDLE = `M0 -20C28 -20 ${f(NLEN*0.45)} -8.5 ${f(NLEN)} 0C${f(NLEN*0.45)} 8.5 28 20 0 20A20 20 0 0 1 0 -20Z`;
const EYE = 'M6 -7H58A7 7 0 0 1 58 7H6A7 7 0 0 1 6 -7Z';
const PLACE = `translate(${E[0]} ${E[1]}) rotate(${f(NANG * 180 / Math.PI)})`;
const THREAD = [
  'M238 152C268 126 302 158 334 138S374 116 388 100',
  'M222 180C206 218 210 254 192 288S168 324 156 332',
  'M410 320C474 358 562 390 642 450S700 560 694 628',
  'M694 628C672 594 640 604 656 634S688 646 694 628',
  'M694 628C720 596 758 606 748 640S708 652 694 628',
  'M694 628C668 662 636 694 620 730',
];

function mark(c, { detail = 'full', gap = 'mask', id = 'sutura', mono = false } = {}) {
  const inner = W / 2 - O / 2, tip = W * 0.62, out = [];
  const small = detail === 'small';
  const w = small ? 1.35 : 1; // heavier lines when tiny
  const fillStroke = `<path d="${D}" fill="none" stroke="${mono ? '#000' : c.fill}" stroke-width="${W - O * w}" stroke-dasharray="${f(L - 2*O*w)} ${f(L)}" stroke-dashoffset="${-O * w}" stroke-linejoin="round"/>`;
  if (mono && detail === 'full') {
    // One colour: the tape as an outline. Below full size the outline is too thin, so it stays solid.
    out.push(`<mask id="${id}t"><rect x="0" y="0" width="912" height="864" fill="#fff"/>${fillStroke}</mask>`);
    out.push(`<path d="${D}" fill="none" stroke="${c.line}" stroke-width="${W + O * w}" stroke-linejoin="round" mask="url(#${id}t)"/>`);
  } else if (mono) {
    out.push(`<path d="${D}" fill="none" stroke="${c.line}" stroke-width="${W + O * w}" stroke-linejoin="round"/>`);
  } else {
    out.push(`<path d="${D}" fill="none" stroke="${c.line}" stroke-width="${W + O * w}" stroke-linejoin="round"/>`, fillStroke);
  }
  if (!small && !mono) {
    const s1 = L * 0.40, s2 = L * 0.70;
    out.push(`<path d="${run(s1, s2, -inner + 9)}" fill="none" stroke="${c.shade}" stroke-width="18" stroke-linecap="round"/>`);
    out.push(`<path d="${run(s1, s2, -inner + 18)}" fill="none" stroke="${c.mark}" stroke-width="5" stroke-linecap="round"/>`);
  }
  for (const [s0, s1] of [[O, O + tip], [L - O - tip, L - O]]) {
    out.push(`<path d="${run(s0, s1)}" fill="none" stroke="${c.mark}" stroke-width="${W - O * w}"/>`);
    if (!small && !mono) {
      const m = at((s0 + s1) / 2 + (s0 < L / 2 ? 4 : -4)), a = f(Math.atan2(m.t[1], m.t[0]) * 180 / Math.PI);
      out.push(`<ellipse cx="${f(m.p[0])}" cy="${f(m.p[1])}" rx="8" ry="13" transform="rotate(${a} ${f(m.p[0])} ${f(m.p[1])})" fill="${c.fill}"/>`);
    }
  }
  if (detail === 'full') {
    const lines = [], twist = L * 0.66, runs = [[0.085, 0.20], [0.40, 0.62], [0.68, 0.90]];
    for (let k = 0, s = O + tip + 20; s < L - O - tip - 16; s += 26, k++) {
      if (!runs.some(([a, b]) => s >= a * L && s <= b * L)) continue;
      const side = s < twist ? 1 : -1, m = at(s), len = k % 2 ? 18 : 30;
      const a = off(m, side * inner), b = off(m, side * (inner - len));
      if (nearNeedle(a) || nearNeedle(b)) continue;
      lines.push(`M${a.map(f)}L${b.map(f)}`);
    }
    out.push(`<path d="${lines.join('')}" fill="none" stroke="${c.mark}" stroke-width="7" stroke-linecap="round"/>`);
  }
  let body = out.join('');
  // Needle on top, with a gap round it where it crosses the tape.
  const needle = `<path transform="${PLACE}" fill-rule="evenodd" fill="${c.line}" d="${NEEDLE}${EYE}"/>`;
  if (gap === 'mask') {
    body = `<mask id="${id}g"><rect x="0" y="0" width="912" height="864" fill="#fff"/><path transform="${PLACE}" d="${NEEDLE}" fill="#000" stroke="#000" stroke-width="${8 * w}" stroke-linejoin="round"/></mask><g mask="url(#${id}g)">${body}</g>`;
  } else {
    // As a style, so a CSS variable works here (presentation attributes don't take var() everywhere).
    body += `<path transform="${PLACE}" d="${NEEDLE}" style="fill:${gap.halo};stroke:${gap.halo}" stroke-width="${8 * w}" stroke-linejoin="round"/>`;
  }
  body += needle;
  body += `<path d="${THREAD.join('')}" fill="none" stroke="${c.line}" stroke-width="${small ? 15 : 8.5}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return body;
}

// Square box round the whole mark (needle strand to bow tail), and the tighter box used beside the wordmark.
mark.SQUARE = '125 84 660 660';

mark.BOX = { x: 150, y: 92, w: 615, h: 646 };
mark.S_CENTRE_Y = 450; // middle of the S itself, for lining up the wordmark
mark.PALETTES = {
  light: { line: '#4A3428', mark: '#4A3428', fill: '#9A8073', shade: '#806556' },
  dark: { line: '#F3ECE6', mark: '#4A3428', fill: '#9A8073', shade: '#806556' },
  mono: { line: '#000000', mark: '#000000', fill: '#000000', shade: '#000000' },
};
module.exports = mark;
