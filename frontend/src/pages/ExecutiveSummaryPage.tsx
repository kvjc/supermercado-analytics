import { Package, Receipt, TrendingUp, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { HorizontalBarChartPanel } from '../components/charts/HorizontalBarChartPanel'
import { ChartCard } from '../components/cards/ChartCard'
import { InsightCard } from '../components/cards/InsightCard'
import { KpiCard } from '../components/cards/KpiCard'
import { EmptyState } from '../components/states/EmptyState'
import { ErrorState } from '../components/states/ErrorState'
import { LoadingState } from '../components/states/LoadingState'
import { api, type ApiResponse, type CategoryResult, type Metadata, type PeakDay, type SummaryData, type TopClient, type TopProduct } from '../services/api'
import { formatClientLabel, formatDate, formatNumber, formatProductLabel, formatShortDate } from '../utils/formatters'

export function ExecutiveSummaryPage() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<ApiResponse<SummaryData>>({ data: {}, status: 'empty' })
  const [products, setProducts] = useState<ApiResponse<TopProduct[]>>({ data: [], status: 'empty' })
  const [clients, setClients] = useState<ApiResponse<TopClient[]>>({ data: [], status: 'empty' })
  const [peakDays, setPeakDays] = useState<ApiResponse<PeakDay[]>>({ data: [], status: 'empty' })
  const [categories, setCategories] = useState<ApiResponse<CategoryResult[]>>({ data: [], status: 'empty' })
  const [metadata, setMetadata] = useState<ApiResponse<Metadata>>({ data: {}, status: 'empty' })

  useEffect(() => {
    Promise.all([api.summary(), api.topProducts(), api.topClients(), api.peakDays(), api.categories(), api.metadata()]).then(
      ([summaryResult, productResult, clientResult, peakDayResult, categoryResult, metadataResult]) => {
        setSummary(summaryResult)
        setProducts(productResult)
        setClients(clientResult)
        setPeakDays(peakDayResult)
        setCategories(categoryResult)
        setMetadata(metadataResult)
        setLoading(false)
      },
    )
  }, [])

  const productChart = useMemo(
    () => products.data.map((item) => ({
      name: formatProductLabel(item.id_producto),
      value: item.cantidad,
      id: item.id_producto,
      categoria: item.categoria,
      frecuencia: item.frecuencia,
    })),
    [products.data],
  )
  const clientChart = useMemo(
    () => clients.data.map((item) => ({
      name: formatClientLabel(item.id_cliente),
      value: item.numero_transacciones ?? item.compras,
      id: item.id_cliente,
      volumen_total: item.volumen_total,
    })),
    [clients.data],
  )
  const peakChart = useMemo(
    () => peakDays.data.slice(0, 10).map((item) => ({
      name: formatShortDate(item.fecha),
      value: item.numero_transacciones ?? item.transacciones,
      fecha: item.fecha,
      volumen_total: item.volumen_total,
    })),
    [peakDays.data],
  )
  const categoryChart = useMemo(
    () => categories.data.map((item) => ({
      name: item.categoria,
      value: item.cantidad,
      porcentaje_relativo: item.porcentaje_relativo,
      frecuencia: item.frecuencia,
    })),
    [categories.data],
  )

  const topProduct = products.data[0]
  const topClient = clients.data[0]
  const topDay = peakDays.data[0]
  const categoryCoverage = metadata.data.category_coverage?.porcentaje_con_categoria ?? metadata.data.category_match_percentage
  const categoryMissing = metadata.data.category_coverage?.porcentaje_sin_categoria

  if (loading) {
    return <LoadingState label="Consultando API de resumen ejecutivo..." />
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <span className="eyebrow">Resumen Ejecutivo</span>
        <h2>Vista general del comportamiento transaccional del supermercado</h2>
        <p>Indicadores calculados por el pipeline y expuestos desde FastAPI.</p>
      </section>

      {summary.status === 'error' ? (
        <ErrorState message={summary.message ?? undefined} />
      ) : (
        <section className="kpi-grid">
          <KpiCard helper="Volumen total procesado" icon={<Package size={18} />} label="Unidades vendidas" value={formatNumber(summary.data.total_units ?? 0)} />
          <KpiCard helper="Transacciones únicas" icon={<Receipt size={18} />} label="Transacciones" value={formatNumber(summary.data.total_transactions ?? summary.data.transactions_count ?? 0)} />
          <KpiCard helper={topProduct ? `${formatNumber(topProduct.cantidad)} unidades${topProduct.categoria ? ` · ${topProduct.categoria}` : ''}` : 'Sin resultado'} icon={<TrendingUp size={18} />} label="Producto más comprado" value={topProduct ? formatProductLabel(topProduct.id_producto) : 'Sin dato'} />
          <KpiCard helper={topClient ? `${formatNumber(topClient.numero_transacciones ?? topClient.compras)} compras únicas` : 'Sin resultado'} icon={<Users size={18} />} label="Cliente más frecuente" value={topClient ? formatClientLabel(topClient.id_cliente) : 'Sin dato'} />
          <KpiCard helper={topDay ? `${formatNumber(topDay.numero_transacciones ?? topDay.transacciones)} transacciones` : 'Sin resultado'} icon={<TrendingUp size={18} />} label="Día pico" value={topDay ? formatDate(topDay.fecha) : 'Sin dato'} />
        </section>
      )}

      <section className="dashboard-grid dashboard-grid--two">
        <ChartCard insight={topProduct ? `El producto líder concentra ${formatNumber(topProduct.cantidad)} unidades vendidas.` : 'Ejecuta el pipeline para ver el producto líder.'} subtitle="Productos con mayor volumen de unidades vendidas" title="Top 10 productos">
          {products.status === 'error' ? <ErrorState message={products.message ?? undefined} /> : productChart.length ? (
            <HorizontalBarChartPanel
              data={productChart}
              labelWidth={132}
              tooltip={(row) => (
                <>
                  <strong>{row.name}</strong>
                  <p>ID producto: {row.id}</p>
                  <p>Categoría: {row.categoria ?? 'Sin categoría asociada'}</p>
                  <p>Unidades vendidas: {formatNumber(Number(row.value))}</p>
                </>
              )}
            />
          ) : <EmptyState />}
        </ChartCard>
        <ChartCard insight={topClient ? `El cliente más frecuente registra ${formatNumber(topClient.numero_transacciones ?? topClient.compras)} compras únicas.` : 'Ejecuta el pipeline para ver clientes frecuentes.'} subtitle="Clientes con mayor frecuencia de compra" title="Top 10 clientes">
          {clients.status === 'error' ? <ErrorState message={clients.message ?? undefined} /> : clientChart.length ? (
            <HorizontalBarChartPanel
              barColor="#2563EB"
              data={clientChart}
              labelWidth={140}
              tooltip={(row) => (
                <>
                  <strong>{row.name}</strong>
                  <p>ID cliente: {row.id}</p>
                  <p>Transacciones: {formatNumber(Number(row.value))}</p>
                  <p>Volumen total: {formatNumber(Number(row.volumen_total ?? 0))}</p>
                </>
              )}
            />
          ) : <EmptyState />}
        </ChartCard>
        <ChartCard insight="Fechas con mayor actividad transaccional para soporte operativo." subtitle="Fechas con mayor número de transacciones" title="Top 10 días pico">
          {peakDays.status === 'error' ? <ErrorState message={peakDays.message ?? undefined} /> : peakChart.length ? (
            <HorizontalBarChartPanel
              barColor="#F59E0B"
              data={peakChart}
              labelWidth={118}
              tooltip={(row) => (
                <>
                  <strong>{formatDate(String(row.fecha))}</strong>
                  <p>Transacciones: {formatNumber(Number(row.value))}</p>
                  <p>Unidades: {formatNumber(Number(row.volumen_total ?? 0))}</p>
                </>
              )}
            />
          ) : <EmptyState />}
        </ChartCard>
        <ChartCard insight={`Top 10 categorías válidas por unidades vendidas. Cobertura de catálogo: ${categoryCoverage === undefined ? 'sin dato' : `${formatNumber(categoryCoverage)}%`} con categoría${categoryMissing === undefined ? '' : ` y ${formatNumber(categoryMissing)}% sin categoría`}.`} subtitle="Volumen relativo por categoría" title="Categorías más relevantes">
          {categories.status === 'error' ? <ErrorState message={categories.message ?? undefined} /> : categoryChart.length ? (
            <HorizontalBarChartPanel
              barColor="#0F766E"
              data={categoryChart}
              labelWidth={250}
              tooltip={(row) => (
                <>
                  <strong>{row.name}</strong>
                  <p>Cantidad: {formatNumber(Number(row.value))}</p>
                  <p>Porcentaje relativo: {formatNumber(Number(row.porcentaje_relativo ?? 0))}%</p>
                  <p>Los productos sin categoría se conservan en métricas generales, pero no entran en este ranking.</p>
                </>
              )}
            />
          ) : <EmptyState />}
        </ChartCard>
      </section>

      <section className="insight-panel">
        <div className="chart-card__header">
          <div>
            <h2>Insights automáticos</h2>
            <p>Lectura breve basada solo en resultados disponibles desde la API.</p>
          </div>
        </div>
        <div className="insight-list">
          {topProduct ? <InsightCard description={`${formatProductLabel(topProduct.id_producto)} concentra el mayor volumen registrado en el pipeline.`} title="Producto líder" /> : null}
          {topClient ? <InsightCard description={`${formatClientLabel(topClient.id_cliente)} aparece como el más frecuente por compras únicas.`} title="Cliente destacado" /> : null}
          {topDay ? <InsightCard description={`${formatDate(topDay.fecha)} es la fecha de mayor actividad transaccional.`} title="Pico operativo" /> : null}
          {!topProduct && !topClient && !topDay ? <EmptyState description="Ejecuta el pipeline para activar insights ejecutivos." /> : null}
        </div>
      </section>
    </div>
  )
}
