// Usage: node wordpath.js <font.ttf> <text> <fontSize> <trackingEm>  → prints {d, width, ascent, capHeight}
const opentype = require('opentype.js');
const [font, text, size, track] = [opentype.loadSync(process.argv[2]), process.argv[3], Number(process.argv[4]), Number(process.argv[5] || 0)];
let x = 0; const parts = [];
const glyphs = font.stringToGlyphs(text);
glyphs.forEach((g, i) => {
  const p = g.getPath(x, 0, size);
  parts.push(p.toPathData(2));
  x += g.advanceWidth * size / font.unitsPerEm;
  if (i < glyphs.length - 1) x += track * size;
});
const box = new opentype.Path(); parts.forEach(() => {});
const all = font.getPath(text, 0, 0, size); // for bbox only (no tracking)
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
glyphs.forEach((g, i) => {});
const joined = parts.join('');
// bbox from tracked paths
const nums = [];
const tracked = new opentype.Path();
x = 0;
glyphs.forEach((g, i) => { const p = g.getPath(x, 0, size); p.commands.forEach(c => tracked.commands.push(c)); x += g.advanceWidth * size / font.unitsPerEm + (i < glyphs.length - 1 ? track * size : 0); });
const bb = tracked.getBoundingBox();
console.log(JSON.stringify({ d: joined, x1: bb.x1, y1: bb.y1, x2: bb.x2, y2: bb.y2, capHeight: (font.tables.os2.sCapHeight || 0) * size / font.unitsPerEm }));
