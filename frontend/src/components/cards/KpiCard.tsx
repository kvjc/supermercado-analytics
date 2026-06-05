import type { ReactNode } from 'react'

export function KpiCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string
  value: string
  helper?: string
  icon?: ReactNode
}) {
  return (
    <article className="kpi-card">
      <div className="kpi-card__top">
        <span>{label}</span>
        {icon ? <div className="kpi-card__icon">{icon}</div> : null}
      </div>
      <strong>{value}</strong>
      {helper ? <p>{helper}</p> : null}
    </article>
  )
}
