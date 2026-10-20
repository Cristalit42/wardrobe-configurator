import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { Config } from './types'
import Controls from './components/Controls'
import Drawing from './components/Drawing'
import Spec from './components/Spec'
import { buildDrawing } from './lib/drawing'
import { toDxf } from './lib/dxf'
import { download } from './lib/download'
import { MATERIALS } from './lib/materials'
import { buildParts, buildSpec, estimate } from './lib/model'
import { fromHash, toHash } from './lib/share'

// three.js тяжёлый — грузим 3D отдельным чанком, чтобы интерфейс появлялся сразу
const Scene = lazy(() => import('./components/Scene'))

export default function App() {
  const [config, setConfig] = useState<Config>(() => fromHash(window.location.hash))
  const [doorsOpen, setDoorsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    window.history.replaceState(null, '', toHash(config))
  }, [config])

  // Если ссылку с другим проектом открыли в той же вкладке
  useEffect(() => {
    const onHash = () => setConfig(fromHash(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const spec = useMemo(() => buildSpec(buildParts(config)), [config])
  const cost = useMemo(() => estimate(config, spec), [config, spec])
  const drawing = useMemo(() => buildDrawing(config), [config])
  const name = `shkaf-${config.width}x${config.height}x${config.depth}`

  const exportSvg = () => {
    if (svgRef.current) download(`${name}.svg`, svgRef.current.outerHTML, 'image/svg+xml')
  }
  const exportDxf = () => download(`${name}.dxf`, toDxf(drawing), 'application/dxf')
  const exportCsv = () => {
    const lines = ['Деталь;Длина, мм;Ширина, мм;Толщина, мм;Кол-во', ...spec.map((r) => [r.name, r.length, r.width, r.thickness, r.qty].join(';'))]
    download(`${name}.csv`, '﻿' + lines.join('\n'), 'text/csv;charset=utf-8')
  }
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      window.prompt('Скопируйте ссылку', window.location.href)
    }
  }

  return (
    <div className="min-h-full">
      <header className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3 sm:px-6">
        <div>
          <h1 className="text-lg font-semibold">Конфигуратор шкафа</h1>
          <p className="text-xs text-stone-500">Выберите размеры и наполнение — чертёж и спецификация соберутся сами</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Btn onClick={copyLink}>{copied ? 'Ссылка скопирована' : 'Ссылка на проект'}</Btn>
          <Btn onClick={exportDxf}>DXF</Btn>
          <Btn onClick={exportSvg}>SVG</Btn>
          <Btn onClick={exportCsv}>Спецификация CSV</Btn>
          <Btn primary onClick={() => window.print()}>
            PDF
          </Btn>
        </div>
      </header>

      {/* На телефоне: 3D → настройки → чертёж; на десктопе настройки слева во всю высоту */}
      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[300px_1fr]">
        <div className="no-print relative h-[55vh] min-h-80 min-w-0 overflow-hidden rounded-2xl ring-1 ring-stone-200 lg:col-start-2">
          <Suspense fallback={<div className="grid h-full place-items-center text-sm text-stone-400">Загружаю 3D…</div>}>
            <Scene config={config} doorsOpen={doorsOpen && config.doors} />
          </Suspense>
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-white/80 px-3 py-1.5 text-xs text-stone-600 backdrop-blur">
            {config.width} × {config.height} × {config.depth} мм · {MATERIALS[config.material].name}
          </div>
        </div>

        <aside className="no-print rounded-2xl bg-stone-50 p-5 ring-1 ring-stone-200 lg:sticky lg:top-6 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-start">
          <Controls config={config} onChange={setConfig} doorsOpen={doorsOpen} onDoorsOpen={setDoorsOpen} />
        </aside>

        <main className="min-w-0 space-y-4 lg:col-start-2">
          <h2 className="hidden text-xl font-semibold print:block">
            Шкаф {config.width} × {config.height} × {config.depth} мм, {MATERIALS[config.material].name}
            {config.doors ? ', распашные двери' : ', без дверей'}
          </h2>

          <div className="grid gap-4 xl:grid-cols-[3fr_2fr] print:grid-cols-1">
            <Card title="Чертёж">
              <Drawing ref={svgRef} data={drawing} />
            </Card>
            <Card title="Спецификация">
              <Spec rows={spec} estimate={cost} />
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-stone-200 print:break-inside-avoid print:ring-0">
      <h2 className="mb-3 text-sm font-semibold text-stone-500">{title}</h2>
      {children}
    </section>
  )
}

function Btn({ primary, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
  return (
    <button
      {...props}
      className={`rounded-lg px-3 py-1.5 font-medium transition ${
        primary ? 'bg-amber-700 text-white hover:bg-amber-800' : 'bg-stone-100 hover:bg-stone-200'
      }`}
    />
  )
}
