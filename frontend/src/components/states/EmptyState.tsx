export function EmptyState({
  title = 'Datos pendientes por conectar',
  description = 'Cuando el pipeline genere el resultado correspondiente, este modulo se actualizara automaticamente desde la API.',
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="state-box state-box--empty">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}
