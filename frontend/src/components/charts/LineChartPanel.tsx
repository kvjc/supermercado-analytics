import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDate, formatNumber, formatShortDate } from '../../utils/formatters'

export function LineChartPanel({
  data,
  lineColor = '#2563EB',
}: {
  data: Array<{ fecha: string; valor: number }>
  lineColor?: string
}) {
  return (
    <ResponsiveContainer height={320} width="100%">
      <LineChart data={data} margin={{ bottom: 22, left: 4, right: 12, top: 8 }}>
        <CartesianGrid stroke="#E5E7EB" strokeDasharray="4 4" vertical={false} />
        <XAxis
          dataKey="fecha"
          height={44}
          interval="preserveStartEnd"
          minTickGap={30}
          stroke="#6B7280"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => formatShortDate(String(value))}
        />
        <YAxis stroke="#6B7280" tickFormatter={(value) => formatNumber(Number(value))} width={58} />
        <Tooltip
          contentStyle={{ border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 16px 35px rgba(15, 23, 42, 0.12)' }}
          labelFormatter={(value) => formatDate(String(value))}
          formatter={(value) => formatNumber(Number(value))}
        />
        <Line dataKey="valor" dot={false} stroke={lineColor} strokeWidth={3} type="monotone" />
      </LineChart>
    </ResponsiveContainer>
  )
}
