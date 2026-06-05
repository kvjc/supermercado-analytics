import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ReactNode } from 'react'
import { formatNumber } from '../../utils/formatters'

type ChartValue = string | number | null | undefined
type ChartRow = Record<string, ChartValue>

export function HorizontalBarChartPanel({
  data,
  barColor = '#16A34A',
  height = 360,
  labelWidth = 180,
  nameKey = 'name',
  valueKey = 'value',
  tooltip,
}: {
  data: ChartRow[]
  barColor?: string
  height?: number
  labelWidth?: number
  nameKey?: string
  valueKey?: string
  tooltip?: (row: ChartRow) => ReactNode
}) {
  return (
    <ResponsiveContainer height={height} width="100%">
      <BarChart data={data} layout="vertical" margin={{ bottom: 8, left: 8, right: 42, top: 8 }}>
        <CartesianGrid stroke="#E5E7EB" strokeDasharray="4 4" horizontal={false} />
        <XAxis stroke="#6B7280" tickFormatter={(value) => formatNumber(Number(value))} type="number" />
        <YAxis
          dataKey={nameKey}
          stroke="#6B7280"
          tick={{ fontSize: 12 }}
          type="category"
          width={labelWidth}
        />
        <Tooltip
          content={({ active, payload }) => {
            const row = payload?.[0]?.payload as ChartRow | undefined
            if (!active || !row) {
              return null
            }
            return <div className="chart-tooltip">{tooltip ? tooltip(row) : <p>{formatNumber(Number(row[valueKey]))}</p>}</div>
          }}
        />
        <Bar dataKey={valueKey} fill={barColor} radius={[0, 6, 6, 0]}>
          <LabelList dataKey={valueKey} formatter={(value) => formatNumber(Number(value))} position="right" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
