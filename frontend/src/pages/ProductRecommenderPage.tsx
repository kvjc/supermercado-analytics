import { PackageSearch, Search, Sparkles, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState } from '../components/states/EmptyState'
import { ErrorState } from '../components/states/ErrorState'
import { LoadingState } from '../components/states/LoadingState'
import {
  api,
  type ApiResponse,
  type ClientLookup,
  type ProductLookup,
  type Recommendation,
  type TopClient,
  type TopProduct,
} from '../services/api'
import { formatClientLabel, formatNumber, formatProductLabel } from '../utils/formatters'

const productTitle = (product: ProductLookup | null, fallbackId: string) =>
  product?.producto_label ?? product?.label ?? formatProductLabel(product?.id_producto ?? fallbackId)
const clientTitle = (client: ClientLookup | null, fallbackId: string) =>
  client?.cliente_label ?? client?.label ?? formatClientLabel(client?.id_cliente ?? fallbackId)

export function ProductRecommenderPage() {
  const [searchParams] = useSearchParams()
  const [productId, setProductId] = useState('')
  const [clientId, setClientId] = useState(searchParams.get('cliente') ?? '')
  const [productResult, setProductResult] = useState<ApiResponse<Recommendation[]> | null>(null)
  const [clientResult, setClientResult] = useState<ApiResponse<Recommendation[]> | null>(null)
  const [productLookup, setProductLookup] = useState<ProductLookup | null>(null)
  const [clientLookup, setClientLookup] = useState<ClientLookup | null>(null)
  const [recommendationProducts, setRecommendationProducts] = useState<Record<string, ProductLookup>>({})
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [topClients, setTopClients] = useState<TopClient[]>([])
  const [loading, setLoading] = useState<'product' | 'client' | null>(null)

  useEffect(() => {
    Promise.all([api.topProductLookup(), api.topClientLookup()]).then(([productExamples, clientExamples]) => {
      setTopProducts(productExamples.data.slice(0, 3))
      setTopClients(clientExamples.data.slice(0, 3))
    })
  }, [])

  useEffect(() => {
    const clientFromQuery = searchParams.get('cliente')
    if (clientFromQuery) {
      searchClient(clientFromQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const enrichRecommendations = async (recommendations: Recommendation[]) => {
    const uniqueIds = Array.from(new Set(recommendations.map((item) => String(item.product_id))))
    const lookups = await Promise.all(uniqueIds.map((id) => api.getProductLookup(id)))
    const nextMap: Record<string, ProductLookup> = {}
    lookups.forEach((lookup, index) => {
      if (lookup.data) {
        nextMap[uniqueIds[index]] = lookup.data
      }
    })
    setRecommendationProducts(nextMap)
  }

  const searchProduct = async (nextProductId = productId) => {
    const value = nextProductId.trim()
    if (!value) {
      return
    }
    setProductId(value)
    setLoading('product')
    const [lookup, recommendations] = await Promise.all([api.getProductLookup(value), api.productRecommendations(value)])
    setProductLookup(lookup.data)
    setProductResult(recommendations)
    await enrichRecommendations(recommendations.data)
    setLoading(null)
  }

  const searchClient = async (nextClientId = clientId) => {
    const value = nextClientId.trim()
    if (!value) {
      return
    }
    setClientId(value)
    setLoading('client')
    const [lookup, recommendations] = await Promise.all([api.getClientLookup(value), api.clientRecommendations(value)])
    setClientLookup(lookup.data)
    setClientResult(recommendations)
    await enrichRecommendations(recommendations.data)
    setLoading(null)
  }

  const renderProductExamples = () => (
    <div className="example-chips">
      {topProducts.map((product) => (
        <button key={product.id_producto} onClick={() => searchProduct(String(product.id_producto))} type="button">
          {formatProductLabel(product.id_producto)}
        </button>
      ))}
    </div>
  )

  const renderClientExamples = () => (
    <div className="example-chips">
      {topClients.map((client) => (
        <button key={client.id_cliente} onClick={() => searchClient(String(client.id_cliente))} type="button">
          {formatClientLabel(client.id_cliente)}
        </button>
      ))}
    </div>
  )

  const renderRecommendationCard = (item: Recommendation, icon: 'search' | 'sparkles') => {
    const metadata = recommendationProducts[String(item.product_id)]
    const Icon = icon === 'search' ? PackageSearch : Sparkles
    return (
      <article className="recommendation-card" key={`${item.product_id}-${item.score}`}>
        <Icon aria-hidden="true" size={22} />
        <div>
          <strong>{productTitle(metadata ?? null, item.product_id)}</strong>
          <p>ID: {item.product_id}</p>
          <p>Categoría: {metadata?.categoria ?? 'Sin categoría asociada'}</p>
          <p>Score: {formatNumber(item.score)}</p>
          <p>{icon === 'search' ? 'Aparece frecuentemente en transacciones junto al producto consultado.' : 'Recomendado por similitud con productos comprados anteriormente.'}</p>
        </div>
      </article>
    )
  }

  const renderProductRecommendations = () => {
    if (!productResult) {
      return <EmptyState description="Prueba con un producto frecuente para ver qué productos suelen comprarse junto a él." title="Sin consulta activa" />
    }
    if (productResult.status === 'error') {
      return <ErrorState message={productResult.message ?? undefined} />
    }
    if (!productResult.data.length) {
      return <EmptyState description="No hay co-ocurrencias suficientes para este producto." title="Sin recomendaciones" />
    }
    return <section className="recommendation-grid recommendation-grid--two">{productResult.data.map((item) => renderRecommendationCard(item, 'search'))}</section>
  }

  const renderClientRecommendations = () => {
    if (!clientResult) {
      return <EmptyState description="Prueba con un cliente frecuente para ver productos sugeridos desde su historial." title="Sin consulta activa" />
    }
    if (clientResult.status === 'error') {
      return <ErrorState message={clientResult.message ?? undefined} />
    }
    if (!clientResult.data.length) {
      return <EmptyState description="No hay recomendaciones suficientes para este cliente." title="Sin recomendaciones" />
    }
    return <section className="recommendation-grid recommendation-grid--two">{clientResult.data.map((item) => renderRecommendationCard(item, 'sparkles'))}</section>
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <span className="eyebrow">Recomendador de Productos</span>
        <h2>Recomendaciones basadas en co-ocurrencia</h2>
        <p>Este módulo recomienda productos usando co-ocurrencia: productos que suelen aparecer juntos en las mismas transacciones.</p>
      </section>
      <section className="dashboard-grid dashboard-grid--two">
        <section className="chart-card">
          <div className="chart-card__header">
            <div>
              <h2>Recomendación por producto</h2>
              <p>Ingresa un producto y descubre qué otros productos suelen comprarse junto a él.</p>
            </div>
          </div>
          <div className="search-row">
            <input onChange={(event) => setProductId(event.target.value)} placeholder="Ej: 5" type="text" value={productId} />
            <button onClick={() => searchProduct()} type="button">
              <Search aria-hidden="true" size={17} />
              Consultar
            </button>
          </div>
          <p className="helper-text">Ejemplos para probar:</p>
          {renderProductExamples()}
          {productLookup ? (
            <div className="lookup-summary">
              <PackageSearch aria-hidden="true" />
              <div>
                <strong>{productTitle(productLookup, productId)}</strong>
                <p>Categoría: {productLookup.categoria ?? 'Sin categoría asociada'} · Unidades: {formatNumber(productLookup.unidades_vendidas ?? productLookup.cantidad ?? 0)}</p>
              </div>
            </div>
          ) : null}
          {loading === 'product' ? <LoadingState label="Buscando recomendaciones..." /> : renderProductRecommendations()}
        </section>
        <section className="chart-card">
          <div className="chart-card__header">
            <div>
              <h2>Recomendación por cliente</h2>
              <p>Ingresa un cliente y consulta productos relacionados con su historial de compras.</p>
            </div>
          </div>
          <div className="search-row">
            <input onChange={(event) => setClientId(event.target.value)} placeholder="Ej: 336296" type="text" value={clientId} />
            <button onClick={() => searchClient()} type="button">
              <Search aria-hidden="true" size={17} />
              Consultar
            </button>
          </div>
          <p className="helper-text">Ejemplos para probar:</p>
          {renderClientExamples()}
          {clientLookup ? (
            <div className="lookup-summary">
              <UserRound aria-hidden="true" />
              <div>
                <strong>{clientTitle(clientLookup, clientId)}</strong>
                <p>
                  Transacciones: {formatNumber(clientLookup.transacciones ?? clientLookup.compras ?? 0)} · Segmento:{' '}
                  {clientLookup.segmento ?? 'sin segmento disponible'} · Volumen: {formatNumber(clientLookup.volumen_total ?? 0)}
                </p>
              </div>
            </div>
          ) : null}
          {loading === 'client' ? <LoadingState label="Buscando recomendaciones..." /> : renderClientRecommendations()}
        </section>
      </section>
    </div>
  )
}
