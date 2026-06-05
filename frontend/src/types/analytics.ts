export type CsvPrimitive = string | number | boolean | null

export type CsvRow = Record<string, CsvPrimitive>

export interface KPI {
  id: string
  label: string
  value: string | number
  helper?: string
}

export interface ProductoTop {
  producto: string
  cantidad: number
}

export interface ClienteTop {
  cliente: string
  cantidad: number
}

export interface SerieTiempo {
  fecha: string
  valor: number
}

export interface FeatureCliente {
  cliente?: string
  segmento?: string
  [key: string]: CsvPrimitive | undefined
}

export interface MatrizCorrelacion {
  variable: string
  values: Record<string, number>
}

export interface ResultadoNuevoDataset {
  totalUnidades: number
  numeroTransacciones: number
  topProductos: ProductoTop[]
  topClientes: ClienteTop[]
  transaccionesPorDia: SerieTiempo[]
}

export type EstadoCargaDatos = 'idle' | 'loading' | 'success' | 'empty' | 'error'

export interface DataResult<T> {
  status: EstadoCargaDatos
  data: T[]
  error?: string
}
