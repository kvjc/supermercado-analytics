import type { CSSProperties } from 'react'
import type { MatrizCorrelacion } from '../../types/analytics'
import { formatNumber, getCorrelationDescription, getCorrelationLabel } from '../../utils/formatters'

const getColor = (value: number) => {
  if (!Number.isFinite(value)) {
    return '#F3F4F6'
  }
  const intensity = Math.min(Math.abs(value), 1)
  const alpha = 0.12 + intensity * 0.68
  return value >= 0 ? `rgba(22, 163, 74, ${alpha})` : `rgba(37, 99, 235, ${alpha})`
}

export function HeatmapPanel({ data }: { data: MatrizCorrelacion[] }) {
  const columns = data[0] ? Object.keys(data[0].values) : []
  const relevant = data
    .flatMap((row) =>
      columns
        .filter((column) => column !== row.variable)
        .map((column) => ({
          a: row.variable,
          b: column,
          key: [row.variable, column].sort().join('|'),
          value: row.values[column],
        })),
    )
    .filter((item, index, items) => Number.isFinite(item.value) && items.findIndex((other) => other.key === item.key) === index)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)

  return (
    <div className="correlation-panel">
      <p className="helper-text">
        La correlación va de -1 a 1. Valores cercanos a 1 indican relación positiva fuerte; valores cercanos a 0
        indican baja relación lineal.
      </p>
      <div className="heatmap-wrap">
        <div className="heatmap" style={{ '--heatmap-columns': columns.length + 1 } as CSSProperties}>
          <div className="heatmap__cell heatmap__cell--header">Variable</div>
          {columns.map((column) => (
            <div className="heatmap__cell heatmap__cell--header" key={column} title={column}>
              {getCorrelationLabel(column)}
            </div>
          ))}
          {data.map((row) => (
            <div className="heatmap__row" key={row.variable}>
              <div className="heatmap__cell heatmap__cell--axis" title={row.variable}>{getCorrelationLabel(row.variable)}</div>
              {columns.map((column) => {
                const value = row.values[column] ?? Number.NaN
                return (
                  <div
                    className="heatmap__cell"
                    key={column}
                    style={{ background: getColor(value) }}
                    title={`${getCorrelationLabel(row.variable)} vs ${getCorrelationLabel(column)}: ${Number.isFinite(value) ? formatNumber(value) : 'N/D'}`}
                  >
                    {Number.isFinite(value) ? formatNumber(value) : 'N/D'}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="correlation-highlights">
        <h3>Relaciones destacadas</h3>
        {relevant.map((item) => (
          <article key={item.key}>
            <strong>
              {getCorrelationLabel(item.a)} y {getCorrelationLabel(item.b)}
            </strong>
            <span>{formatNumber(item.value)} · {getCorrelationDescription(item.value)}</span>
          </article>
        ))}
      </div>
    </div>
  )
}
