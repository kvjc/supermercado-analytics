const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

export interface ApiResponse<T> {
  status: 'success' | 'empty' | 'error'
  data: T
  message?: string | null
  total?: number
  limit?: number
  offset?: number
}

export interface SummaryData {
  total_units?: number
  total_transactions?: number
  transactions_count?: number
  records_count?: number
  clients_count?: number
  products_count?: number
}

export interface TopProduct {
  id_producto: string
  cantidad: number
  frecuencia?: number
  categoria?: string
  porcentaje_relativo?: number
}

export interface TopClient {
  id_cliente: string
  numero_transacciones?: number
  compras: number
  volumen_total?: number
}

export interface PeakDay {
  fecha: string
  numero_transacciones?: number
  transacciones: number
  volumen_total?: number
}

export interface CategoryResult {
  categoria: string
  cantidad: number
  frecuencia?: number
  porcentaje_relativo?: number
}

export interface TimeSeriesPoint {
  fecha: string
  valor?: number
  unidades?: number
  transacciones?: number
}

export interface CorrelationRow {
  variable: string
  [key: string]: string | number | null
}

export interface WeekdayPoint {
  dia_semana: string
  numero_transacciones?: number
  transacciones?: number
  unidades?: number
  cantidad?: number
}

export interface CustomerSegment {
  id_cliente: string
  segmento: number
  frecuencia: number
  productos_distintos: number
  volumen_total: number
  categorias_distintas: number
  cantidad_promedio: number
}

export interface SegmentProfile {
  segmento: number
  clientes: number
  frecuencia: number
  productos_distintos: number
  volumen_total: number
  categorias_distintas: number
  cantidad_promedio: number
  interpretacion?: string
}

export interface Recommendation {
  product_id: string
  score: number
  reason?: string
}

export interface ProductLookup {
  id_producto: string
  producto_label?: string
  label?: string
  categoria_id?: string | null
  categoria?: string | null
  tiene_categoria?: boolean
  unidades_vendidas?: number | null
  cantidad?: number | null
  transacciones?: number | null
  frecuencia?: number | null
  clientes_unicos?: number | null
  es_top_producto?: boolean
  nota_catalogo?: string | null
}

export interface CategoryLookup {
  categoria_id: string
  categoria: string
  productos_asociados: number
  unidades_vendidas: number
  transacciones: number
  porcentaje_relativo: number
  lineas_sin_categoria?: number
  porcentaje_sin_categoria?: number
}

export interface ClientLookup {
  id_cliente: string
  cliente_label?: string
  label?: string
  transacciones?: number | null
  compras?: number | null
  volumen_total?: number | null
  productos_distintos?: number | null
  categorias_distintas?: number | null
  cantidad_promedio?: number | null
  segmento?: number | null
  interpretacion_segmento?: string | null
}

export interface Metadata {
  status?: string
  last_update?: string | null
  processed_files?: string[]
  records_processed?: number
  invalid_records?: number
  category_match_percentage?: number
  category_coverage?: {
    total_lineas: number
    lineas_con_categoria: number
    lineas_sin_categoria: number
    porcentaje_con_categoria: number
    porcentaje_sin_categoria: number
    productos_con_multiples_categorias: number
    filas_product_category_original: number
    productos_unicos_product_category: number
    filas_product_category_deduplicado: number
    filas_base_antes_merge: number
    filas_despues_merge: number
    diferencia_filas_merge: number
    regla_deduplicacion: string
  }
  generated_files?: string[]
  message?: string
}

const buildQuery = (params: Record<string, string | number | boolean | undefined>) => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  })
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

const request = async <T>(path: string, fallback: T): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`)
    if (!response.ok) {
      return { data: fallback, message: `La API respondió con estado ${response.status}.`, status: 'error' }
    }
    return (await response.json()) as ApiResponse<T>
  } catch (error) {
    return {
      data: fallback,
      message: error instanceof Error ? error.message : 'No fue posible conectar con la API.',
      status: 'error',
    }
  }
}

export const api = {
  health: () => request<{ status: string; service: string }>('/health', { service: 'SAT API', status: 'error' }),
  summary: () => request<SummaryData>('/summary', {}),
  topProducts: () => request<TopProduct[]>('/top-products', []),
  topClients: () => request<TopClient[]>('/top-clients', []),
  peakDays: () => request<PeakDay[]>('/peak-days', []),
  dailySeries: () => request<TimeSeriesPoint[]>('/time-series/daily', []),
  weeklySeries: () => request<TimeSeriesPoint[]>('/time-series/weekly', []),
  weekdayTransactions: () => request<WeekdayPoint[]>('/weekday/transactions', []),
  weekdayUnits: () => request<WeekdayPoint[]>('/weekday/units', []),
  categories: () => request<CategoryResult[]>('/categories', []),
  correlations: () => request<CorrelationRow[]>('/correlations', []),
  segmentationCustomers: () => request<CustomerSegment[]>('/segmentation/customers', []),
  segmentationProfiles: () => request<SegmentProfile[]>('/segmentation/profiles', []),
  productRecommendations: (productId: string) => request<Recommendation[]>(`/recommendations/product/${encodeURIComponent(productId)}`, []),
  clientRecommendations: (clientId: string) => request<Recommendation[]>(`/recommendations/client/${encodeURIComponent(clientId)}`, []),
  getProductsLookup: (params: { search?: string; limit?: number; offset?: number; has_category?: boolean } = {}) =>
    request<ProductLookup[]>(`/lookup/products${buildQuery(params)}`, []),
  getProductLookup: (productId: string) =>
    request<ProductLookup>(`/lookup/products/${encodeURIComponent(productId)}`, {
      id_producto: productId,
      producto_label: `Producto ${productId}`,
    }),
  getCategoriesLookup: (params: { search?: string; limit?: number; offset?: number } = {}) =>
    request<CategoryLookup[]>(`/lookup/categories${buildQuery(params)}`, []),
  getCategoryLookup: (categoryId: string) =>
    request<CategoryLookup | null>(`/lookup/categories/${encodeURIComponent(categoryId)}`, null),
  getClientsLookup: (params: { search?: string; limit?: number; offset?: number } = {}) =>
    request<ClientLookup[]>(`/lookup/clients${buildQuery(params)}`, []),
  getClientLookup: (clientId: string) =>
    request<ClientLookup>(`/lookup/clients/${encodeURIComponent(clientId)}`, {
      id_cliente: clientId,
      cliente_label: `Cliente ${clientId}`,
    }),
  productLookup: (productId: string) =>
    request<ProductLookup>(`/lookup/product/${encodeURIComponent(productId)}`, {
      id_producto: productId,
      producto_label: `Producto ${productId}`,
    }),
  clientLookup: (clientId: string) =>
    request<ClientLookup>(`/lookup/client/${encodeURIComponent(clientId)}`, {
      id_cliente: clientId,
      cliente_label: `Cliente ${clientId}`,
    }),
  topProductLookup: () => request<TopProduct[]>('/lookup/products/top', []),
  topClientLookup: () => request<TopClient[]>('/lookup/clients/top', []),
  metadata: () => request<Metadata>('/metadata/last-update', {}),
}
