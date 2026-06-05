export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="state-box state-box--error">
      <strong>No fue posible cargar esta visualizacion</strong>
      <p>{message ?? 'Revisa el archivo CSV asociado y vuelve a intentar.'}</p>
    </div>
  )
}
