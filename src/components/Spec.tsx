import type { SpecRow } from '../types'
import { PRICES } from '../lib/model'

interface Props {
  rows: SpecRow[]
  estimate: { chipboard: number; hdf: number; rods: number; hinges: number; total: number }
}

const rub = (v: number) => v.toLocaleString('ru-RU') + ' ₽'
const m2 = (v: number) => v.toFixed(2).replace('.', ',') + ' м²'

export default function Spec({ rows, estimate }: Props) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead className="text-left text-xs text-stone-500">
            <tr className="border-b border-stone-200">
              <th className="py-2 pr-2 font-medium">Деталь</th>
              <th className="px-2 text-right font-medium">Длина</th>
              <th className="px-2 text-right font-medium">Ширина</th>
              <th className="px-2 text-right font-medium">Толщ.</th>
              <th className="pl-2 text-right font-medium">Кол-во</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-stone-100">
                <td className="py-1.5 pr-2">{r.name}</td>
                <td className="px-2 text-right">{r.length}</td>
                <td className="px-2 text-right">{r.width}</td>
                <td className="px-2 text-right">{r.thickness}</td>
                <td className="pl-2 text-right font-medium">{r.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-stone-500">ЛДСП 16 мм</dt>
        <dd className="text-right">{m2(estimate.chipboard)}</dd>
        <dt className="text-stone-500">ХДФ задней стенки</dt>
        <dd className="text-right">{m2(estimate.hdf)}</dd>
        <dt className="text-stone-500">Петли</dt>
        <dd className="text-right">{estimate.hinges} шт</dd>
        <dt className="border-t border-stone-200 pt-2 font-medium">Материалы, примерно</dt>
        <dd className="border-t border-stone-200 pt-2 text-right text-lg font-semibold text-amber-800">
          {rub(estimate.total)}
        </dd>
      </dl>
      <p className="text-xs text-stone-400">
        Демо-цены: ЛДСП {PRICES.chipboard} ₽/м², ХДФ {PRICES.hdf} ₽/м², штанга {PRICES.rod} ₽, петля {PRICES.hinge} ₽.
        Кромка и работа не учтены.
      </p>
    </div>
  )
}
