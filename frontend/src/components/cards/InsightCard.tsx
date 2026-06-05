import type { ReactNode } from 'react'

export function InsightCard({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon?: ReactNode
}) {
  return (
    <article className="insight-card">
      {icon ? <span className="insight-card__icon">{icon}</span> : null}
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </article>
  )
}
