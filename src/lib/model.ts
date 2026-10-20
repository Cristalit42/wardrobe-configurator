import type { Config, Part, SpecRow } from '../types'

export const T = 16 // ЛДСП
export const BACK = 4 // ХДФ задней стенки
export const PLINTH = 80
export const SHELF_INSET = 20 // отступ полки от фасада
export const DOOR_GAP = 3
export const ROD_D = 25
export const HANGER_TOP = 350 // от верха до полки над штангой
export const MIN_SECTION = 300

export const LIMITS = {
  width: { min: 600, max: 3000, step: 10 },
  height: { min: 1200, max: 2700, step: 10 },
  depth: { min: 350, max: 700, step: 10 },
  shelves: { min: 0, max: 8 },
}

export function maxSections(width: number) {
  return Math.max(1, Math.min(5, Math.floor((width - T) / (MIN_SECTION + T))))
}

// Если ширина уменьшилась и секции перестали помещаться — убираю лишние справа
export function fit(c: Config): Config {
  const max = maxSections(c.width)
  return c.sections.length > max ? { ...c, sections: c.sections.slice(0, max) } : c
}

export function sectionWidth(cfg: Config) {
  const n = cfg.sections.length
  return (cfg.width - 2 * T - (n - 1) * T) / n
}

export function sectionX(cfg: Config, i: number) {
  return T + i * (sectionWidth(cfg) + T)
}

export function doorsInSection(secW: number) {
  return secW > 600 ? 2 : 1
}

const box = (
  name: string,
  kind: Part['kind'],
  x0: number,
  y0: number,
  z0: number,
  sx: number,
  sy: number,
  sz: number,
): Part => ({ name, kind, pos: [x0 + sx / 2, y0 + sy / 2, z0 + sz / 2], size: [sx, sy, sz] })

export function buildParts(cfg: Config): Part[] {
  const { width: W, height: H, depth: D } = cfg
  const n = cfg.sections.length
  const dc = D - BACK
  const innerW = W - 2 * T
  const y0 = PLINTH + T
  const y1 = H - T
  const innerH = y1 - y0
  const secW = sectionWidth(cfg)
  const parts: Part[] = []

  parts.push(box('Боковина', 'carcass', 0, 0, BACK, T, H, dc))
  parts.push(box('Боковина', 'carcass', W - T, 0, BACK, T, H, dc))
  parts.push(box('Крыша', 'carcass', T, H - T, BACK, innerW, T, dc))
  parts.push(box('Дно', 'carcass', T, PLINTH, BACK, innerW, T, dc))
  parts.push(box('Цоколь', 'plinth', T, 0, D - 30 - T, innerW, PLINTH, T))
  parts.push(box('Задняя стенка', 'back', 0, PLINTH, 0, W, H - PLINTH, BACK))

  for (let i = 1; i < n; i++) {
    parts.push(box('Перегородка', 'carcass', sectionX(cfg, i) - T, y0, BACK, T, innerH, dc))
  }

  const shelfDepth = dc - SHELF_INSET
  cfg.sections.forEach((s, i) => {
    const x = sectionX(cfg, i)
    if (s.type === 'hanger') {
      const shelfY = y1 - HANGER_TOP - T
      parts.push(box('Полка', 'shelf', x, shelfY, BACK, secW, T, shelfDepth))
      parts.push(box('Штанга', 'rod', x, shelfY - 70, BACK + dc / 2 - ROD_D / 2, secW, ROD_D, ROD_D))
      return
    }
    const gap = (innerH - s.shelves * T) / (s.shelves + 1)
    for (let j = 0; j < s.shelves; j++) {
      parts.push(box('Полка', 'shelf', x, y0 + (j + 1) * gap + j * T, BACK, secW, T, shelfDepth))
    }
  })

  if (cfg.doors) {
    const doorH = H - PLINTH - DOOR_GAP
    cfg.sections.forEach((_, i) => {
      const left = i === 0 ? 0 : sectionX(cfg, i) - T / 2
      const right = i === n - 1 ? W : sectionX(cfg, i) + secW + T / 2
      const cnt = doorsInSection(secW)
      const dw = (right - left) / cnt
      for (let k = 0; k < cnt; k++) {
        parts.push(
          box('Дверь', 'door', left + k * dw + DOOR_GAP / 2, PLINTH + DOOR_GAP / 2, D, dw - DOOR_GAP, doorH, T),
        )
      }
    })
  }

  return parts
}

// Длина — по большей стороне детали, ширина — по второй, толщина — по меньшей
export function buildSpec(parts: Part[]): SpecRow[] {
  const rows = new Map<string, SpecRow>()
  for (const p of parts) {
    const dims = [...p.size].map((v) => Math.round(v)).sort((a, b) => b - a)
    const [length, width, thickness] = p.kind === 'rod' ? [dims[0], ROD_D, ROD_D] : dims
    const key = `${p.name}|${length}|${width}|${thickness}`
    const row = rows.get(key)
    if (row) row.qty++
    else rows.set(key, { name: p.name, length, width, thickness, qty: 1 })
  }
  return [...rows.values()]
}

export const PRICES = {
  chipboard: 1900, // ЛДСП 16 мм, ₽/м²
  hdf: 450, // ХДФ, ₽/м²
  rod: 600, // штанга с держателями, ₽/шт
  hinge: 250, // петля, ₽/шт
}

export function hingesPerDoor(height: number) {
  return height > 2000 ? 4 : height > 1500 ? 3 : 2
}

export function estimate(cfg: Config, spec: SpecRow[]) {
  let chipboard = 0
  let hdf = 0
  let rods = 0
  let doors = 0
  for (const r of spec) {
    const area = ((r.length * r.width) / 1e6) * r.qty
    if (r.name === 'Штанга') rods += r.qty
    else if (r.thickness === BACK) hdf += area
    else chipboard += area
    if (r.name === 'Дверь') doors += r.qty
  }
  const hinges = doors * hingesPerDoor(cfg.height)
  const total =
    chipboard * PRICES.chipboard + hdf * PRICES.hdf + rods * PRICES.rod + hinges * PRICES.hinge
  return { chipboard, hdf, rods, hinges, total: Math.round(total / 10) * 10 }
}
