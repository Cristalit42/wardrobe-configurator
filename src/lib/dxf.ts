import type { Dim, Drawing } from './drawing'

const TICK = 30
const TEXT_H = 50

type Seg = [number, number, number, number, string]

// Размер раскладываю на обычные линии и текст: такой DXF открывается в любой CAD-программе
export function dimSegments(d: Dim): { segs: Seg[]; text: { x: number; y: number; rot: number } } {
  const segs: Seg[] = []
  if (d.dir === 'h') {
    segs.push([d.a, d.at, d.b, d.at, 'DIM'])
    for (const x of [d.a, d.b]) {
      segs.push([x, d.from, x, d.at + Math.sign(d.at - d.from) * 40, 'DIM'])
      segs.push([x - TICK, d.at - TICK, x + TICK, d.at + TICK, 'DIM'])
    }
    return { segs, text: { x: (d.a + d.b) / 2, y: d.at + 20, rot: 0 } }
  }
  segs.push([d.at, d.a, d.at, d.b, 'DIM'])
  for (const y of [d.a, d.b]) {
    segs.push([d.from, y, d.at + Math.sign(d.at - d.from) * 40, y, 'DIM'])
    segs.push([d.at - TICK, y - TICK, d.at + TICK, y + TICK, 'DIM'])
  }
  return { segs, text: { x: d.at - 20, y: (d.a + d.b) / 2, rot: 90 } }
}

function line([x1, y1, x2, y2, layer]: Seg) {
  return ['0', 'LINE', '8', layer, '10', x1, '20', y1, '30', 0, '11', x2, '21', y2, '31', 0]
}

function text(x: number, y: number, value: string, rot = 0, layer = 'TEXT') {
  // 72 = 1 — выравнивание по центру, точка привязки берётся из 11/21
  return ['0', 'TEXT', '8', layer, '10', x, '20', y, '30', 0, '40', TEXT_H, '1', escape(value), '50', rot, '72', 1, '11', x, '21', y, '31', 0]
}

export function toDxf(dr: Drawing): string {
  const out: (string | number)[] = ['0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1009', '0', 'ENDSEC']
  out.push('0', 'SECTION', '2', 'ENTITIES')

  for (const r of dr.rects) {
    const c: [number, number][] = [
      [r.x, r.y],
      [r.x + r.w, r.y],
      [r.x + r.w, r.y + r.h],
      [r.x, r.y + r.h],
    ]
    c.forEach(([x, y], i) => {
      const [nx, ny] = c[(i + 1) % 4]
      out.push(...line([x, y, nx, ny, 'CONTOUR']))
    })
  }
  for (const l of dr.lines) out.push(...line([l.x1, l.y1, l.x2, l.y2, l.dashed ? 'HIDDEN' : 'CONTOUR']))
  for (const d of dr.dims) {
    const { segs, text: t } = dimSegments(d)
    segs.forEach((s) => out.push(...line(s)))
    out.push(...text(t.x, t.y, d.text, t.rot, 'DIM'))
  }
  for (const lb of dr.labels) out.push(...text(lb.x, lb.y, lb.text))

  out.push('0', 'ENDSEC', '0', 'EOF')
  return out.map((v) => (typeof v === 'number' ? fmt(v) : v)).join('\r\n') + '\r\n'
}

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(3))

// Кириллицу кодирую как \U+XXXX — так её правильно читают AutoCAD и другие CAD-программы
const escape = (s: string) =>
  [...s].map((c) => (c.charCodeAt(0) > 127 ? '\\U+' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0') : c)).join('')
