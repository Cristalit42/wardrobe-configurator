import type { Config } from '../types'
import { BACK, HANGER_TOP, PLINTH, ROD_D, SHELF_INSET, T, buildParts, sectionWidth, sectionX } from './model'

// Геометрия чертежа в мм, ось Y направлена вверх (как в DXF). SVG переворачивает её сам.
export interface Rect {
  x: number
  y: number
  w: number
  h: number
  fill?: boolean
}

export interface Line {
  x1: number
  y1: number
  x2: number
  y2: number
  dashed?: boolean
}

export interface Dim {
  dir: 'h' | 'v'
  a: number
  b: number
  at: number // положение размерной линии
  from: number // откуда идут выносные линии
  text: string
}

export interface Label {
  x: number
  y: number
  text: string
}

export interface Drawing {
  rects: Rect[]
  lines: Line[]
  dims: Dim[]
  labels: Label[]
  bounds: { x: number; y: number; w: number; h: number }
}

export const SIDE_GAP = 400 // расстояние между видом спереди и видом сбоку

export function buildDrawing(cfg: Config): Drawing {
  const { width: W, height: H, depth: D } = cfg
  const rects: Rect[] = []
  const lines: Line[] = []
  const dims: Dim[] = []
  const labels: Label[] = []

  // Вид спереди без дверей: каждая деталь — прямоугольник своего торца
  for (const p of buildParts(cfg)) {
    if (p.kind === 'door' || p.kind === 'back') continue
    const [cx, cy] = p.pos
    const [sx, sy] = p.size
    rects.push({ x: cx - sx / 2, y: cy - sy / 2, w: sx, h: sy, fill: p.kind !== 'rod' && p.kind !== 'plinth' })
  }

  const secW = sectionWidth(cfg)
  const n = cfg.sections.length
  const s = (v: number) => String(Math.round(v))

  dims.push({ dir: 'h', a: 0, b: W, at: H + 180, from: H, text: s(W) })
  dims.push({ dir: 'v', a: 0, b: H, at: -180, from: 0, text: s(H) })
  dims.push({ dir: 'v', a: 0, b: PLINTH, at: W + 120, from: W, text: s(PLINTH) })
  dims.push({ dir: 'v', a: PLINTH + T, b: H - T, at: -90, from: T, text: s(H - PLINTH - 2 * T) })
  cfg.sections.forEach((sec, i) => {
    const x = sectionX(cfg, i)
    dims.push({ dir: 'h', a: x, b: x + secW, at: -110, from: PLINTH, text: s(secW) })
    labels.push({
      x: x + secW / 2,
      y: sec.type === 'hanger' ? H - T - HANGER_TOP - T - 260 : PLINTH + T + 60,
      text: sec.type === 'hanger' ? 'штанга' : shelvesLabel(sec.shelves),
    })
  })
  if (n > 0 && cfg.sections.some((x) => x.type === 'hanger')) {
    const i = cfg.sections.findIndex((x) => x.type === 'hanger')
    const x = sectionX(cfg, i)
    dims.push({ dir: 'v', a: H - T - HANGER_TOP, b: H - T, at: x + secW - 60, from: x + secW, text: s(HANGER_TOP) })
  }

  // Вид сбоку: разрез по средней секции
  const ox = W + SIDE_GAP
  rects.push({ x: ox, y: PLINTH, w: BACK, h: H - PLINTH, fill: false })
  rects.push({ x: ox + BACK, y: 0, w: D - BACK, h: H, fill: false })
  rects.push({ x: ox + BACK, y: H - T, w: D - BACK, h: T, fill: true })
  rects.push({ x: ox + BACK, y: PLINTH, w: D - BACK, h: T, fill: true })
  rects.push({ x: ox + D - 30 - T, y: 0, w: T, h: PLINTH, fill: true })
  const mid = cfg.sections[Math.floor(n / 2)]
  if (mid) {
    for (const p of buildParts({ ...cfg, sections: [mid], doors: false })) {
      if (p.kind === 'shelf') {
        const [, cy] = p.pos
        rects.push({ x: ox + BACK, y: cy - T / 2, w: D - BACK - SHELF_INSET, h: T, fill: true })
      }
      if (p.kind === 'rod') {
        const [, cy, cz] = p.pos
        lines.push({ x1: ox + cz - ROD_D / 2, y1: cy, x2: ox + cz + ROD_D / 2, y2: cy })
        lines.push({ x1: ox + cz, y1: cy - ROD_D / 2, x2: ox + cz, y2: cy + ROD_D / 2 })
      }
    }
  }
  if (cfg.doors) lines.push({ x1: ox + D + T, y1: PLINTH, x2: ox + D + T, y2: H, dashed: true })
  dims.push({ dir: 'h', a: ox, b: ox + D, at: H + 180, from: H, text: s(D) })

  labels.push({ x: W / 2, y: -260, text: 'Вид спереди (без дверей)' })
  labels.push({ x: ox + D / 2, y: -260, text: 'Вид сбоку' })

  return { rects, lines, dims, labels, bounds: { x: -330, y: -330, w: ox + D + 200 + 330, h: H + 330 + 300 } }
}

function shelvesLabel(n: number) {
  if (n === 0) return 'без полок'
  const m10 = n % 10
  const word = m10 === 1 && n !== 11 ? 'полка' : m10 >= 2 && m10 <= 4 && (n < 12 || n > 14) ? 'полки' : 'полок'
  return `${n} ${word}`
}
