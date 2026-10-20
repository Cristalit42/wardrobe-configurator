import { useState } from 'react'
import type { Config, MaterialId, Section } from '../types'
import { LIMITS, fit, maxSections, sectionWidth } from '../lib/model'
import { MATERIALS } from '../lib/materials'

interface Props {
  config: Config
  onChange: (c: Config) => void
  doorsOpen: boolean
  onDoorsOpen: (v: boolean) => void
}

export default function Controls({ config, onChange, doorsOpen, onDoorsOpen }: Props) {
  const set = (patch: Partial<Config>) => onChange(fit({ ...config, ...patch }))
  const setSection = (i: number, patch: Partial<Section>) =>
    set({ sections: config.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) })

  const max = maxSections(config.width)
  const secW = Math.round(sectionWidth(config))

  return (
    <div className="space-y-6">
      <Group title="Габариты, мм">
        <Range label="Ширина" value={config.width} {...LIMITS.width} onChange={(width) => set({ width })} />
        <Range label="Высота" value={config.height} {...LIMITS.height} onChange={(height) => set({ height })} />
        <Range label="Глубина" value={config.depth} {...LIMITS.depth} onChange={(depth) => set({ depth })} />
      </Group>

      <Group title={`Секции · ${secW} мм внутри`}>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              disabled={n > max}
              onClick={() => set({ sections: resize(config.sections, n) })}
              className={`h-9 flex-1 rounded-lg text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-30 ${
                n === config.sections.length ? 'bg-amber-700 text-white' : 'bg-white hover:bg-stone-200'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {config.sections.map((s, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-white p-2 text-sm">
              <span className="w-5 text-center text-stone-400">{i + 1}</span>
              <select
                value={s.type}
                onChange={(e) => setSection(i, { type: e.target.value as Section['type'] })}
                className="flex-1 rounded-md border border-stone-200 bg-stone-50 px-2 py-1"
              >
                <option value="shelves">Полки</option>
                <option value="hanger">Штанга</option>
              </select>
              {s.type === 'shelves' && (
                <Stepper
                  value={s.shelves}
                  min={LIMITS.shelves.min}
                  max={LIMITS.shelves.max}
                  onChange={(shelves) => setSection(i, { shelves })}
                />
              )}
            </div>
          ))}
        </div>
      </Group>

      <Group title="Фасады">
        <Toggle label="Распашные двери" checked={config.doors} onChange={(doors) => set({ doors })} />
        <Toggle
          label="Открыть двери"
          checked={doorsOpen}
          disabled={!config.doors}
          onChange={onDoorsOpen}
        />
      </Group>

      <Group title={`Декор · ${MATERIALS[config.material].name}`}>
        <div className="flex gap-2">
          {(Object.keys(MATERIALS) as MaterialId[]).map((id) => (
            <button
              key={id}
              title={MATERIALS[id].name}
              onClick={() => set({ material: id })}
              className={`size-10 rounded-full border-2 transition ${
                id === config.material ? 'border-amber-700 scale-110' : 'border-white'
              }`}
              style={{ background: MATERIALS[id].color }}
            />
          ))}
        </div>
      </Group>
    </div>
  )
}

function resize(sections: Section[], n: number): Section[] {
  if (n <= sections.length) return sections.slice(0, n)
  const extra = Array.from({ length: n - sections.length }, (): Section => ({ type: 'shelves', shelves: 4 }))
  return [...sections, ...extra]
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold tracking-wide text-stone-500 uppercase">{title}</h2>
      {children}
    </section>
  )
}

interface RangeProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}

function Range({ label, value, min, max, step, onChange }: RangeProps) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span>{label}</span>
        <NumberField value={value} min={min} max={max} step={step} onChange={onChange} />
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-700"
      />
    </label>
  )
}

// Пока пользователь печатает, значение живёт локально: иначе «1» из «1800» сразу ломало бы шкаф
function NumberField({ value, min, max, step, onChange }: Omit<RangeProps, 'label'>) {
  const [draft, setDraft] = useState<string | null>(null)
  const commit = () => {
    if (draft === null) return
    const v = Number(draft)
    if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, Math.round(v / step) * step)))
    setDraft(null)
  }
  return (
    <input
      inputMode="numeric"
      value={draft ?? value}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && commit()}
      className="w-20 rounded-md border border-stone-200 bg-white px-2 py-0.5 text-right tabular-nums"
    />
  )
}

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  const btn = 'size-7 rounded-md bg-stone-100 hover:bg-stone-200 disabled:opacity-30'
  return (
    <div className="flex items-center gap-1">
      <button className={btn} disabled={value <= min} onClick={() => onChange(value - 1)} aria-label="Меньше полок">
        −
      </button>
      <span className="w-6 text-center tabular-nums">{value}</span>
      <button className={btn} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="Больше полок">
        +
      </button>
    </div>
  )
}

function Toggle(props: { label: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={`flex items-center justify-between text-sm ${props.disabled ? 'opacity-40' : 'cursor-pointer'}`}>
      {props.label}
      <input
        type="checkbox"
        checked={props.checked}
        disabled={props.disabled}
        onChange={(e) => props.onChange(e.target.checked)}
        className="size-4 accent-amber-700"
      />
    </label>
  )
}
