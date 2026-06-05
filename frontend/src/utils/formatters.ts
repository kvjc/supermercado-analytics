export const formatNumber = (value: number | string | null | undefined): string => {
  const numeric = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(numeric)) {
    return String(value ?? 'Sin dato')
  }

  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: numeric % 1 === 0 ? 0 : 2,
  }).format(numeric)
}

export const formatDate = (value: string | null | undefined): string => {
  if (!value) {
    return 'Sin fecha'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

export const formatShortDate = (value: string | null | undefined): string => {
  if (!value) {
    return 'Sin fecha'
  }

  const parsed = new Date(`${value}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
  }).format(parsed)
}

export const formatPercent = (value: number): string =>
  new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 2,
  }).format(value) + '%'

export const formatCompactNumber = (value: number | string | null | undefined): string => {
  const numeric = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(numeric)) {
    return String(value ?? 'Sin dato')
  }

  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 2,
    notation: 'compact',
  }).format(numeric)
}

export const formatProductLabel = (productId: string | number | null | undefined): string =>
  productId ? `Producto ${productId}` : 'Producto sin dato'

export const formatClientLabel = (clientId: string | number | null | undefined): string =>
  clientId ? `Cliente ${clientId}` : 'Cliente sin dato'

export const getCorrelationLabel = (value: string): string => {
  const labels: Record<string, string> = {
    frecuencia: 'Frecuencia',
    cantidad_total: 'Cantidad total',
    volumen_total: 'Volumen total',
    productos_distintos: 'Productos distintos',
    sucursales_distintas: 'Sucursales distintas',
    categorias_distintas: 'Categorías distintas',
    cantidad_promedio_por_transaccion: 'Prom. productos/transacción',
    cantidad_promedio: 'Prom. productos/transacción',
  }

  return labels[value] ?? value
}

export const getCorrelationDescription = (value: number): string => {
  if (!Number.isFinite(value)) {
    return 'sin valor disponible'
  }

  const absValue = Math.abs(value)
  if (absValue >= 0.75) {
    return value > 0 ? 'relación positiva fuerte' : 'relación negativa fuerte'
  }
  if (absValue >= 0.4) {
    return value > 0 ? 'relación positiva moderada' : 'relación negativa moderada'
  }
  return 'baja relación lineal'
}
