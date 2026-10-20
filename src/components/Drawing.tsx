import type { Ref } from 'react'
import type { Drawing as DrawingData } from '../lib/drawing'
import { dimSegments } from '../lib/dxf'

// Чертёж хранится в координатах CAD (Y вверх), здесь просто меняю знак Y
const Y = (y: number) => -y

export default function Drawing({ data, ref }: { data: DrawingData; ref?: Ref<SVGSVGElement> }) {
  const { x, y, w, h } = data.bounds
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${x} ${-(y + h)} ${w} ${h}`}
      className="h-auto w-full"
      fontFamily="Arial, sans-serif"
    >
      <rect x={x} y={-(y + h)} width={w} height={h} fill="#fff" />

      {data.rects.map((r, i) => (
        <rect
          key={i}
          x={r.x}
          y={Y(r.y + r.h)}
          width={r.w}
          height={r.h}
          fill={r.fill ? '#f3ede4' : 'none'}
          stroke="#292524"
          strokeWidth={3}
        />
      ))}

      {data.lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={Y(l.y1)}
          x2={l.x2}
          y2={Y(l.y2)}
          stroke="#292524"
          strokeWidth={3}
          strokeDasharray={l.dashed ? '30 20' : undefined}
        />
      ))}

      {data.dims.map((d, i) => {
        const { segs, text } = dimSegments(d)
        return (
          <g key={i} stroke="#b45309" strokeWidth={2}>
            {segs.map(([x1, y1, x2, y2], j) => (
              <line key={j} x1={x1} y1={Y(y1)} x2={x2} y2={Y(y2)} />
            ))}
            <text
              x={text.x}
              y={Y(text.y)}
              transform={text.rot ? `rotate(-90 ${text.x} ${Y(text.y)})` : undefined}
              textAnchor="middle"
              fontSize={68}
              fill="#b45309"
              stroke="none"
            >
              {d.text}
            </text>
          </g>
        )
      })}

      {data.labels.map((l, i) => (
        <text key={i} x={l.x} y={Y(l.y)} textAnchor="middle" fontSize={68} fill="#57534e">
          {l.text}
        </text>
      ))}
    </svg>
  )
}
