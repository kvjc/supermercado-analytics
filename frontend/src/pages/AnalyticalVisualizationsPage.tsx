import { useEffect, useMemo, useState } from 'react'
import { BarChartPanel } from '../components/charts/BarChartPanel'
import { HeatmapPanel } from '../components/charts/HeatmapPanel'
import { HorizontalBarChartPanel } from '../components/charts/HorizontalBarChartPanel'
import { LineChartPanel } from '../components/charts/LineChartPanel'
import { ChartCard } from '../components/cards/ChartCard'
import { EmptyState } from '../components/states/EmptyState'
import { ErrorState } from '../components/states/ErrorState'
import { LoadingState } from '../components/states/LoadingState'
import { api, type ApiResponse, type CategoryResult, type CorrelationRow, type TimeSeriesPoint, type WeekdayPoint } from '../services/api'
import type { MatrizCorrelacion } from '../types/analytics'
import { formatNumber } from '../utils/formatters'

const toHeatmap = (rows: CorrelationRow[]): MatrizCorrelacion[] =>
  rows.map((row) => ({
    variable: String(row.variable),
    values: Object.fromEntries(
      Object.entries(row)
        .filter(([key]) => key !== 'variable')
        .map(([key, value]) => [key, value === null ? Number.NaN : Number(value)]),
    ),
  }))

const toLineSeries = (rows: TimeSeriesPoint[]) =>
  rows.map((row) => ({
    fecha: row.fecha,
    valor: row.unidades ?? row.valor ?? 0,
  }))

export function AnalyticalVisualizationsPage() {
  const [loading, setLoading] = useState(true)
  const [daily, setDaily] = useState<ApiResponse<TimeSeriesPoint[]>>({ data: [], status: 'empty' })
  const [weekly, setWeekly] = useState<ApiResponse<TimeSeriesPoint[]>>({ data: [], status: 'empty' })
  const [weekdayTransactions, setWeekdayTransactions] = useState<ApiResponse<WeekdayPoint[]>>({ data: [], status: 'empty' })
  const [weekdayUnits, setWeekdayUnits] = useState<ApiResponse<WeekdayPoint[]>>({ data: [], status: 'empty' })
  const [categories, setCategories] = useState<ApiResponse<CategoryResult[]>>({ data: [], status: 'empty' })
  const [correlations, setCorrelations] = useState<ApiResponse<CorrelationRow[]>>({ data: [], status: 'empty' })

  useEffect(() => {
    Promise.all([
      api.dailySeries(),
      api.weeklySeries(),
      api.weekdayTransactions(),
      api.weekdayUnits(),
      api.categories(),
      api.correlations(),
    ]).then(
      ([dailyResult, weeklyResult, weekdayTransactionsResult, weekdayUnitsResult, categoryResult, correlationResult]) => {
        setDaily(dailyResult)
        setWeekly(weeklyResult)
        setWeekdayTransactions(weekdayTransactionsResult)
        setWeekdayUnits(weekdayUnitsResult)
        setCategories(categoryResult)
        setCorrelations(correlationResult)
        setLoading(false)
      },
    )
  }, [])

  const categoryChart = useMemo(() => categories.data.map((item) => ({ name: item.categoria, value: item.cantidad })), [categories.data])
  const weekdayTransactionsChart = useMemo(
    () => weekdayTransactions.data.map((item) => ({ name: item.dia_semana, value: item.numero_transacciones ?? item.transacciones ?? 0 })),
    [weekdayTransactions.data],
  )
  const weekdayUnitsChart = useMemo(
    () => weekdayUnits.data.map((item) => ({ name: item.dia_semana, value: item.unidades ?? item.cantidad ?? 0 })),
    [weekdayUnits.data],
  )
  const heatmap = useMemo(() => toHeatmap(correlations.data), [correlations.data])

  if (loading) {
    return <LoadingState label="Consultando visualizaciones analiticas..." />
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <span className="eyebrow">Visualizaciones Analíticas</span>
        <h2>Series, distribuciones y relaciones entre variables</h2>
        <p>Gráficas alimentadas por resultados generados en `data/results` y servidos por la API.</p>
      </section>
      <section className="dashboard-grid dashboard-grid--two">
        <ChartCard insight="La serie diaria ayuda a detectar picos y caídas operativas." subtitle="Unidades vendidas por fecha" title="Serie diaria">
          {daily.status === 'error' ? <ErrorState message={daily.message ?? undefined} /> : daily.data.length ? <LineChartPanel data={toLineSeries(daily.data)} /> : <EmptyState />}
        </ChartCard>
        <ChartCard insight="La serie semanal permite explicar tendencias agregadas con menos ruido." subtitle="Unidades vendidas por semana" title="Serie semanal">
          {weekly.status === 'error' ? <ErrorState message={weekly.message ?? undefined} /> : weekly.data.length ? <LineChartPanel data={toLineSeries(weekly.data)} lineColor="#16A34A" /> : <EmptyState />}
        </ChartCard>
        <ChartCard insight="Los productos sin categoría se conservan en métricas generales, pero no se incluyen en este ranking porque representan ausencia de clasificación." subtitle="Top 10 categorías válidas por unidades vendidas" title="Distribución por categoría">
          {categories.status === 'error' ? <ErrorState message={categories.message ?? undefined} /> : categoryChart.length ? (
            <HorizontalBarChartPanel
              barColor="#0F766E"
              data={categoryChart}
              labelWidth={250}
              tooltip={(row) => (
                <>
                  <strong>{row.name}</strong>
                  <p>Cantidad: {formatNumber(Number(row.value))}</p>
                </>
              )}
            />
          ) : <EmptyState />}
        </ChartCard>
        <ChartCard insight="Relaciones entre variables numéricas de comportamiento de cliente." subtitle="Correlación de features de clientes" title="Matriz de correlación">
          {correlations.status === 'error' ? <ErrorState message={correlations.message ?? undefined} /> : heatmap.length ? <HeatmapPanel data={heatmap} /> : <EmptyState />}
        </ChartCard>
        <ChartCard insight="Patrón semanal de visitas medido por transacciones únicas." subtitle="Transacciones únicas por día de semana" title="Transacciones por día de la semana">
          {weekdayTransactions.status === 'error' ? <ErrorState message={weekdayTransactions.message ?? undefined} /> : weekdayTransactionsChart.length ? <BarChartPanel barColor="#2563EB" data={weekdayTransactionsChart} /> : <EmptyState />}
        </ChartCard>
        <ChartCard insight="Volumen de unidades vendidas distribuido por día de la semana." subtitle="Unidades vendidas por día de semana" title="Unidades por día de la semana">
          {weekdayUnits.status === 'error' ? <ErrorState message={weekdayUnits.message ?? undefined} /> : weekdayUnitsChart.length ? <BarChartPanel barColor="#F59E0B" data={weekdayUnitsChart} /> : <EmptyState />}
        </ChartCard>
      </section>
    </div>
  )
}
