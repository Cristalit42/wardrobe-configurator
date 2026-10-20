import type { Config } from '../types'
import { MATERIALS } from './materials'
import { LIMITS, maxSections } from './model'

export const DEFAULT_CONFIG: Config = {
  width: 1800,
  height: 2400,
  depth: 600,
  sections: [
    { type: 'shelves', shelves: 5 },
    { type: 'hanger', shelves: 0 },
    { type: 'shelves', shelves: 4 },
  ],
  doors: true,
  material: 'oak',
}

// Конфигурация живёт в адресе страницы: ссылку можно отправить производителю
export function toHash(c: Config) {
  const s = c.sections.map((x) => (x.type === 'hanger' ? 'h' : String(x.shelves))).join('.')
  return `#w=${c.width}&h=${c.height}&d=${c.depth}&s=${s}&doors=${c.doors ? 1 : 0}&m=${c.material}`
}

export function fromHash(hash: string): Config {
  const p = new URLSearchParams(hash.replace(/^#/, ''))
  const num = (key: string, l: { min: number; max: number }, fallback: number) => {
    const v = Number(p.get(key))
    return Number.isFinite(v) && v >= l.min && v <= l.max ? v : fallback
  }
  const width = num('w', LIMITS.width, DEFAULT_CONFIG.width)
  const sections = (p.get('s') ?? '')
    .split('.')
    .filter((x) => x === 'h' || /^\d+$/.test(x))
    .map((x) =>
      x === 'h'
        ? { type: 'hanger' as const, shelves: 0 }
        : { type: 'shelves' as const, shelves: Math.min(LIMITS.shelves.max, Number(x)) },
    )
    .slice(0, maxSections(width))
  const m = p.get('m')

  return {
    width,
    height: num('h', LIMITS.height, DEFAULT_CONFIG.height),
    depth: num('d', LIMITS.depth, DEFAULT_CONFIG.depth),
    sections: sections.length ? sections : DEFAULT_CONFIG.sections.slice(0, maxSections(width)),
    doors: p.has('doors') ? p.get('doors') === '1' : DEFAULT_CONFIG.doors,
    material: m && m in MATERIALS ? (m as Config['material']) : DEFAULT_CONFIG.material,
  }
}
