import type { CsvRow, KPI, MatrizCorrelacion } from '../types/analytics'
import { detectColumn, getColumns, getString, mapTimeRows, mapTopRows, toNumber } from './chartUtils'
import { formatNumber } from './formatters'

export const topProductsFromRows = (rows: CsvRow[]) =>
  mapTopRows(rows, ['producto', 'product', 'item', 'descripcion'], ['cantidad', 'ventas', 'unidades', 'total'])

export const topClientsFromRows = (rows: CsvRow[]) =>
  mapTopRows(rows, ['cliente', 'customer', 'id_cliente', 'customer_id'], ['cantidad', 'compras', 'transacciones', 'total'])

export const peakDaysFromRows = (rows: CsvRow[]) =>
  mapTopRows(rows, ['dia', 'fecha', 'date', 'day'], ['cantidad', 'compras', 'transacciones', 'ventas', 'total'])

export const timeSeriesFromRows = (rows: CsvRow[]) => mapTimeRows(rows)

export const kpisFromRows = (rows: CsvRow[], topProducts: ReturnType<typeof topProductsFromRows>, topClients: ReturnType<typeof topClientsFromRows>, peakDays: ReturnType<typeof peakDaysFromRows>): KPI[] => {
  const columns = getColumns(rows)
  const metricColumn = detectColumn(columns, ['metrica', 'metric', 'kpi', 'indicador', 'nombre']) ?? columns[0]
  const valueColumn = detectColumn(columns, ['valor', 'value', 'total', 'cantidad']) ?? columns[1]
  const rowsByMetric = rows.map((row) => ({
    metric: getString(row, metricColumn).toLowerCase(),
    value: row[valueColumn],
  }))

  const findMetric = (needles: string[]) => {
    const found = rowsByMetric.find((row) => needles.some((needle) => row.metric.includes(needle)))
    return found?.value
  }

  const kpis: KPI[] = []
  const units = findMetric(['unidad', 'cantidad', 'vendid'])
  const transactions = findMetric(['transacc', 'ticket', 'compra'])

  if (units !== undefined) {
    kpis.push({ id: 'units', label: 'Unidades vendidas', value: formatNumber(Number(units)), helper: 'Resultado exportado por el notebook' })
  }

  if (transactions !== undefined) {
    kpis.push({ id: 'transactions', label: 'Transacciones', value: formatNumber(Number(transactions)), helper: 'Volumen total procesado' })
  }

  if (topProducts[0]) {
    kpis.push({ id: 'top-product', label: 'Producto mas comprado', value: topProducts[0].name, helper: `${formatNumber(topProducts[0].value)} unidades` })
  }

  if (topClients[0]) {
    kpis.push({ id: 'top-client', label: 'Cliente mas frecuente', value: topClients[0].name, helper: `${formatNumber(topClients[0].value)} registros` })
  }

  if (peakDays[0]) {
    kpis.push({ id: 'peak-day', label: 'Dia pico de compra', value: peakDays[0].name, helper: `${formatNumber(peakDays[0].value)} eventos` })
  }

  return kpis
}

export const correlationMatrixFromRows = (rows: CsvRow[]): MatrizCorrelacion[] => {
  const columns = getColumns(rows)
  const variableColumn = detectColumn(columns, ['variable', 'feature', 'columna']) ?? columns[0]
  const valueColumns = columns.filter((column) => column !== variableColumn)

  return rows.map((row) => ({
    variable: getString(row, variableColumn),
    values: Object.fromEntries(valueColumns.map((column) => [column, toNumber(row[column])])),
  }))
}

export const distributionFromFeatureRows = (rows: CsvRow[]) => {
  const columns = getColumns(rows)
  const numericColumn =
    detectColumn(columns, ['frecuencia', 'compras', 'transacciones', 'cantidad', 'total', 'monto']) ??
    columns.find((column) => rows.some((row) => toNumber(row[column]) > 0))

  if (!numericColumn) {
    return []
  }

  const values = rows.map((row) => toNumber(row[numericColumn])).filter((value) => Number.isFinite(value))
  if (values.length === 0) {
    return []
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const bucketCount = Math.min(8, Math.max(3, Math.ceil(Math.sqrt(values.length))))
  const span = max - min || 1
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    name: `${formatNumber(min + (span / bucketCount) * index)}-${formatNumber(min + (span / bucketCount) * (index + 1))}`,
    value: 0,
  }))

  values.forEach((value) => {
    const index = Math.min(bucketCount - 1, Math.floor(((value - min) / span) * bucketCount))
    buckets[index].value += 1
  })

  return buckets
}

export const segmentSummaryFromRows = (rows: CsvRow[]) => {
  const columns = getColumns(rows)
  const segmentColumn = detectColumn(columns, ['segmento', 'cluster', 'grupo'])
  if (!segmentColumn) {
    return { segmentColumn: undefined, distribution: [], numericColumns: [] as string[] }
  }

  const distribution = Array.from(
    rows.reduce((map, row) => {
      const segment = getString(row, segmentColumn)
      map.set(segment, (map.get(segment) ?? 0) + 1)
      return map
    }, new Map<string, number>()),
  ).map(([name, value]) => ({ name, value }))

  const numericColumns = columns.filter((column) => column !== segmentColumn && rows.some((row) => toNumber(row[column]) > 0)).slice(0, 4)

  return { segmentColumn, distribution, numericColumns }
}
