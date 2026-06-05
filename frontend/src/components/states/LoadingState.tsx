export function LoadingState({ label = 'Cargando datos...' }: { label?: string }) {
  return (
    <div className="state-box">
      <span className="loader" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}
