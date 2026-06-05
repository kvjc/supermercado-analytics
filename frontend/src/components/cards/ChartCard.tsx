import type { ReactNode } from 'react'

export function ChartCard({
  title,
  subtitle,
  children,
  insight,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  insight?: string
}) {
  return (
    <section className="chart-card">
      <div className="chart-card__header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      <div className="chart-card__body">{children}</div>
      {insight ? <p className="chart-card__insight">{insight}</p> : null}
    </section>
  )
}
