import { CheckCircle2, Database, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { KpiCard } from '../components/cards/KpiCard'
import { EmptyState } from '../components/states/EmptyState'
import { ErrorState } from '../components/states/ErrorState'
import { LoadingState } from '../components/states/LoadingState'
import { api, type ApiResponse, type Metadata } from '../services/api'
import { formatDate, formatNumber } from '../utils/formatters'

export function MetadataPage() {
  const [loading, setLoading] = useState(true)
  const [metadata, setMetadata] = useState<ApiResponse<Metadata>>({ data: {}, status: 'empty' })
  const [health, setHealth] = useState<ApiResponse<{ status: string; service: string }>>({ data: { service: 'SAT API', status: 'unknown' }, status: 'empty' })

  useEffect(() => {
    Promise.all([api.metadata(), api.health()]).then(([metadataResult, healthResult]) => {
      setMetadata(metadataResult)
      setHealth(healthResult)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <LoadingState label="Consultando estado de actualización..." />
  }

  if (metadata.status === 'error') {
    return <ErrorState message={metadata.message ?? undefined} />
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <span className="eyebrow">Estado de Actualización</span>
        <h2>Control técnico de datos procesados</h2>
        <p>Para incorporar nuevos datos, agregue el archivo en `data/raw` y ejecute `python -m pipeline.run_pipeline`.</p>
      </section>
      <section className="kpi-grid">
        <KpiCard helper="Respuesta de /health" icon={<CheckCircle2 size={18} />} label="Salud API" value={health.data.status ?? 'unknown'} />
        <KpiCard helper="Última ejecución registrada" icon={<RefreshCw size={18} />} label="Última actualización" value={metadata.data.last_update ? formatDate(metadata.data.last_update) : 'Sin ejecución'} />
        <KpiCard helper="Registros validos" icon={<Database size={18} />} label="Registros procesados" value={formatNumber(metadata.data.records_processed ?? 0)} />
        <KpiCard helper="Registros descartados" icon={<Database size={18} />} label="Inválidos" value={formatNumber(metadata.data.invalid_records ?? 0)} />
        <KpiCard helper="Líneas con categoría real" icon={<Database size={18} />} label="Cobertura catálogo" value={`${formatNumber(metadata.data.category_coverage?.porcentaje_con_categoria ?? metadata.data.category_match_percentage ?? 0)}%`} />
      </section>
      <section className="dashboard-grid dashboard-grid--two">
        <section className="chart-card">
          <div className="chart-card__header">
            <div>
              <h2>Archivos procesados</h2>
              <p>Entradas detectadas por el pipeline.</p>
            </div>
          </div>
          {metadata.data.processed_files?.length ? (
            <ul className="file-list">
              {metadata.data.processed_files.map((file) => (
                <li key={file}>{file}</li>
              ))}
            </ul>
          ) : (
            <EmptyState description={metadata.data.message ?? 'No hay archivos procesados todavía.'} />
          )}
        </section>
        <section className="chart-card">
          <div className="chart-card__header">
            <div>
              <h2>Resultados disponibles</h2>
              <p>Archivos expuestos por la API desde data/results.</p>
            </div>
          </div>
          {metadata.data.generated_files?.length ? (
            <ul className="file-list">
              {metadata.data.generated_files.map((file) => (
                <li key={file}>{file}</li>
              ))}
            </ul>
          ) : (
            <EmptyState description="Ejecuta el pipeline para generar resultados." />
          )}
        </section>
      </section>
    </div>
  )
}
