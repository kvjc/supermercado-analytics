import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatNumber } from '../../utils/formatters'

export function BarChartPanel({
  data,
  barColor = '#16A34A',
  nameKey = 'name',
  valueKey = 'value',
}: {
  data: Record<string, string | number>[]
  barColor?: string
  nameKey?: string
  valueKey?: string
}) {
  return (
    <ResponsiveContainer height={320} width="100%">
      <BarChart data={data} margin={{ bottom: 22, left: 4, right: 12, top: 8 }}>
        <CartesianGrid stroke="#E5E7EB" strokeDasharray="4 4" vertical={false} />
        <XAxis
          angle={-25}
          dataKey={nameKey}
          height={70}
          interval={0}
          stroke="#6B7280"
          textAnchor="end"
          tick={{ fontSize: 12 }}
        />
        <YAxis stroke="#6B7280" tickFormatter={(value) => formatNumber(Number(value))} width={58} />
        <Tooltip
          contentStyle={{ border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 16px 35px rgba(15, 23, 42, 0.12)' }}
          formatter={(value) => formatNumber(Number(value))}
        />
        <Bar dataKey={valueKey} fill={barColor} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
