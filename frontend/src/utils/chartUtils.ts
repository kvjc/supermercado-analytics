import type { CsvPrimitive, CsvRow } from '../types/analytics'

export const chartPalette = ['#16A34A', '#2563EB', '#F59E0B', '#0F766E', '#7C3AED', '#EA580C']

export const normalizeColumnName = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')

export const detectColumn = (columns: string[], candidates: string[]): string | undefined => {
  const normalizedCandidates = candidates.map(normalizeColumnName)
  const normalizedColumns = columns.map((column) => ({
    original: column,
    normalized: normalizeColumnName(column),
  }))

  return normalizedColumns.find((column) =>
    normalizedCandidates.some(
      (candidate) => column.normalized === candidate || column.normalized.includes(candidate),
    ),
  )?.original
}

export const toNumber = (value: CsvPrimitive | undefined): number => {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value !== 'string') {
    return 0
  }

  const normalized = value.replace(/\./g, '').replace(',', '.').trim()
  const numeric = Number(normalized)

  return Number.isFinite(numeric) ? numeric : 0
}

export const getString = (row: CsvRow, column?: string): string => {
  if (!column) {
    return 'Sin dato'
  }

  const value = row[column]
  return value === null || value === undefined || value === '' ? 'Sin dato' : String(value)
}

export const getColumns = (rows: CsvRow[]): string[] => (rows[0] ? Object.keys(rows[0]) : [])

export const pickLabelAndValueColumns = (
  rows: CsvRow[],
  labelCandidates: string[],
  valueCandidates: string[],
) => {
  const columns = getColumns(rows)
  const labelColumn = detectColumn(columns, labelCandidates) ?? columns[0]
  const valueColumn =
    detectColumn(columns, valueCandidates) ??
    columns.find((column) => rows.some((row) => toNumber(row[column]) > 0)) ??
    columns[1]

  return { labelColumn, valueColumn }
}

export const mapTopRows = (
  rows: CsvRow[],
  labelCandidates: string[],
  valueCandidates: string[],
  limit = 10,
) => {
  const { labelColumn, valueColumn } = pickLabelAndValueColumns(rows, labelCandidates, valueCandidates)

  return rows
    .map((row) => ({
      name: getString(row, labelColumn),
      value: toNumber(row[valueColumn]),
    }))
    .filter((row) => row.name !== 'Sin dato' || row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

export const mapTimeRows = (rows: CsvRow[]) => {
  const { labelColumn, valueColumn } = pickLabelAndValueColumns(
    rows,
    ['fecha', 'date', 'dia', 'semana', 'week'],
    ['ventas', 'unidades', 'cantidad', 'transacciones', 'valor', 'total'],
  )

  return rows
    .map((row) => ({
      fecha: getString(row, labelColumn),
      valor: toNumber(row[valueColumn]),
    }))
    .filter((row) => row.fecha !== 'Sin dato')
}
