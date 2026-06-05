import { useEffect, useMemo, useState } from 'react'
import { BarChartPanel } from '../components/charts/BarChartPanel'
import { ChartCard } from '../components/cards/ChartCard'
import { KpiCard } from '../components/cards/KpiCard'
import { EmptyState } from '../components/states/EmptyState'
import { ErrorState } from '../components/states/ErrorState'
import { LoadingState } from '../components/states/LoadingState'
import { api, type ApiResponse, type CustomerSegment, type SegmentProfile } from '../services/api'
import { formatNumber } from '../utils/formatters'

export function CustomerSegmentationPage() {
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<ApiResponse<CustomerSegment[]>>({ data: [], status: 'empty' })
  const [profiles, setProfiles] = useState<ApiResponse<SegmentProfile[]>>({ data: [], status: 'empty' })

  useEffect(() => {
    Promise.all([api.segmentationCustomers(), api.segmentationProfiles()]).then(([customerResult, profileResult]) => {
      setCustomers(customerResult)
      setProfiles(profileResult)
      setLoading(false)
    })
  }, [])

  const distribution = useMemo(
    () => profiles.data.map((profile) => ({ name: `Segmento ${profile.segmento}`, value: profile.clientes })),
    [profiles.data],
  )

  if (loading) {
    return <LoadingState label="Consultando segmentación..." />
  }

  if (customers.status === 'error' || profiles.status === 'error') {
    return <ErrorState message={customers.message ?? profiles.message ?? undefined} />
  }

  if (!customers.data.length || !profiles.data.length) {
    return (
      <div className="page-stack">
        <section className="page-heading">
          <span className="eyebrow">Segmentación de Clientes</span>
          <h2>Modulo preparado para resultados de K-Means</h2>
          <p>Ejecuta `python -m pipeline.run_pipeline` con datos en `data/raw` para generar segmentos.</p>
        </section>
        <EmptyState description="La API no tiene segmentos disponibles todavía." title="Segmentación pendiente" />
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <span className="eyebrow">Segmentación de Clientes</span>
        <h2>Perfiles de comportamiento generados por K-Means</h2>
        <p>Variables estandarizadas: frecuencia, diversidad de productos, volumen y categorias.</p>
      </section>
      <section className="kpi-grid kpi-grid--compact">
        <KpiCard label="Segmentos detectados" value={formatNumber(profiles.data.length)} />
        <KpiCard label="Clientes segmentados" value={formatNumber(customers.data.length)} />
      </section>
      <section className="dashboard-grid dashboard-grid--two">
        <ChartCard insight="Distribución de clientes por grupo asignado." subtitle="Clientes por segmento analítico" title="Distribución por segmento">
          <BarChartPanel barColor="#2563EB" data={distribution} />
        </ChartCard>
        <section className="chart-card">
          <div className="chart-card__header">
            <div>
              <h2>Perfiles de segmentos</h2>
              <p>Promedios y lectura simple generados por el pipeline.</p>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Segmento</th>
                  <th>Clientes</th>
                  <th>Frecuencia</th>
                  <th>Volumen</th>
                  <th>Diversidad</th>
              <th>Interpretación</th>
                </tr>
              </thead>
              <tbody>
                {profiles.data.map((profile) => (
                  <tr key={profile.segmento}>
                    <td>{profile.segmento}</td>
                    <td>{formatNumber(profile.clientes)}</td>
                    <td>{formatNumber(profile.frecuencia)}</td>
                    <td>{formatNumber(profile.volumen_total)}</td>
                    <td>{formatNumber(profile.productos_distintos)}</td>
                    <td>{profile.interpretacion ?? 'Sin interpretación'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </div>
  )
}
