import { Boxes, ChevronLeft, ChevronRight, Search, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/states/EmptyState'
import { ErrorState } from '../components/states/ErrorState'
import { LoadingState } from '../components/states/LoadingState'
import { api, type ApiResponse, type CategoryLookup, type ClientLookup, type ProductLookup } from '../services/api'
import { formatNumber, formatProductLabel } from '../utils/formatters'

type CatalogTab = 'products' | 'categories' | 'clients'
type ProductFilter = 'all' | 'with-category' | 'without-category'

const PAGE_SIZE = 25

const productName = (product: ProductLookup) => product.producto_label ?? product.label ?? formatProductLabel(product.id_producto)
const clientName = (client: ClientLookup) => client.cliente_label ?? client.label ?? `Cliente ${client.id_cliente}`

export function CatalogsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<CatalogTab>('products')
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [productFilter, setProductFilter] = useState<ProductFilter>('all')
  const [products, setProducts] = useState<ApiResponse<ProductLookup[]>>({ data: [], status: 'empty' })
  const [categories, setCategories] = useState<ApiResponse<CategoryLookup[]>>({ data: [], status: 'empty' })
  const [clients, setClients] = useState<ApiResponse<ClientLookup[]>>({ data: [], status: 'empty' })
  const [selectedProduct, setSelectedProduct] = useState<ProductLookup | null>(null)
  const [selectedClient, setSelectedClient] = useState<ClientLookup | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setOffset(0)
  }, [activeTab, productFilter])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setOffset(0)
    }, 250)
    return () => window.clearTimeout(handle)
  }, [search])

  useEffect(() => {
    let isCurrent = true
    setLoading(true)
    const hasCategory = productFilter === 'all' ? undefined : productFilter === 'with-category'
    const params = { limit: PAGE_SIZE, offset, search: search.trim() || undefined }
    const request =
      activeTab === 'products'
        ? api.getProductsLookup({ ...params, has_category: hasCategory })
        : activeTab === 'categories'
          ? api.getCategoriesLookup(params)
          : api.getClientsLookup(params)

    request.then((response) => {
      if (!isCurrent) {
        return
      }
      if (activeTab === 'products') {
        setProducts(response as ApiResponse<ProductLookup[]>)
      } else if (activeTab === 'categories') {
        setCategories(response as ApiResponse<CategoryLookup[]>)
      } else {
        setClients(response as ApiResponse<ClientLookup[]>)
      }
      setLoading(false)
    })

    return () => {
      isCurrent = false
    }
  }, [activeTab, offset, productFilter, search])

  const currentResponse = useMemo(() => {
    if (activeTab === 'products') {
      return products
    }
    if (activeTab === 'categories') {
      return categories
    }
    return clients
  }, [activeTab, categories, clients, products])

  const total = currentResponse.total ?? currentResponse.data.length
  const canGoBack = offset > 0
  const canGoForward = offset + PAGE_SIZE < total

  const selectProduct = async (product: ProductLookup) => {
    const response = await api.getProductLookup(product.id_producto)
    setSelectedProduct(response.data ?? product)
  }

  const selectClient = async (client: ClientLookup) => {
    const response = await api.getClientLookup(client.id_cliente)
    setSelectedClient(response.data ?? client)
  }

  const renderProducts = () => {
    if (products.status === 'error') {
      return <ErrorState message={products.message ?? undefined} />
    }
    if (!products.data.length) {
      return <EmptyState description="No se encontraron productos con los filtros actuales." />
    }
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>ID</th>
              <th>Categoría</th>
              <th>Unidades</th>
              <th>Transacciones</th>
              <th>Clientes únicos</th>
              <th>Estado catálogo</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {products.data.map((product) => (
              <tr key={product.id_producto}>
                <td>{productName(product)}</td>
                <td>{product.id_producto}</td>
                <td>{product.categoria ?? 'Sin categoría'}</td>
                <td>{formatNumber(product.unidades_vendidas ?? product.cantidad ?? 0)}</td>
                <td>{formatNumber(product.transacciones ?? product.frecuencia ?? 0)}</td>
                <td>{formatNumber(product.clientes_unicos ?? 0)}</td>
                <td>
                  <span className={product.tiene_categoria ? 'status-pill status-pill--ok' : 'status-pill status-pill--warn'}>
                    {product.tiene_categoria ? 'Con categoría' : 'Sin categoría'}
                  </span>
                </td>
                <td>
                  <button className="table-action" onClick={() => selectProduct(product)} type="button">
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderCategories = () => {
    if (categories.status === 'error') {
      return <ErrorState message={categories.message ?? undefined} />
    }
    if (!categories.data.length) {
      return <EmptyState description="No se encontraron categorías válidas." />
    }
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID categoría</th>
              <th>Categoría</th>
              <th>Productos asociados</th>
              <th>Unidades</th>
              <th>Transacciones</th>
              <th>Porcentaje relativo</th>
            </tr>
          </thead>
          <tbody>
            {categories.data.map((category) => (
              <tr key={`${category.categoria_id}-${category.categoria}`}>
                <td>{category.categoria_id}</td>
                <td>{category.categoria}</td>
                <td>{formatNumber(category.productos_asociados)}</td>
                <td>{formatNumber(category.unidades_vendidas)}</td>
                <td>{formatNumber(category.transacciones)}</td>
                <td>{formatNumber(category.porcentaje_relativo)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderClients = () => {
    if (clients.status === 'error') {
      return <ErrorState message={clients.message ?? undefined} />
    }
    if (!clients.data.length) {
      return <EmptyState description="No se encontraron clientes con los filtros actuales." />
    }
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>ID</th>
              <th>Segmento</th>
              <th>Transacciones</th>
              <th>Volumen</th>
              <th>Productos distintos</th>
              <th>Categorías distintas</th>
              <th>Promedio por transacción</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {clients.data.map((client) => (
              <tr key={client.id_cliente}>
                <td>{clientName(client)}</td>
                <td>{client.id_cliente}</td>
                <td>{client.segmento ?? 'Sin segmento'}</td>
                <td>{formatNumber(client.transacciones ?? client.compras ?? 0)}</td>
                <td>{formatNumber(client.volumen_total ?? 0)}</td>
                <td>{formatNumber(client.productos_distintos ?? 0)}</td>
                <td>{formatNumber(client.categorias_distintas ?? 0)}</td>
                <td>{formatNumber(client.cantidad_promedio ?? 0)}</td>
                <td>
                  <button className="table-action" onClick={() => selectClient(client)} type="button">
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <span className="eyebrow">Catálogos</span>
        <h2>Inventario analítico de productos, categorías y clientes</h2>
        <p>Consulta la metadata generada por el pipeline para interpretar IDs sin cargar archivos desde el dashboard.</p>
      </section>

      <section className="chart-card">
        <div className="catalog-tabs" role="tablist">
          <button className={activeTab === 'products' ? 'is-active' : ''} onClick={() => setActiveTab('products')} type="button">
            <Boxes aria-hidden="true" size={17} />
            Productos
          </button>
          <button className={activeTab === 'categories' ? 'is-active' : ''} onClick={() => setActiveTab('categories')} type="button">
            Categorías
          </button>
          <button className={activeTab === 'clients' ? 'is-active' : ''} onClick={() => setActiveTab('clients')} type="button">
            <UserRound aria-hidden="true" size={17} />
            Clientes
          </button>
        </div>

        <div className="catalog-toolbar">
          <label>
            Buscar
            <span className="catalog-search">
              <Search aria-hidden="true" size={17} />
              <input
                onChange={(event) => setSearch(event.target.value)}
                placeholder={activeTab === 'products' ? 'ID, Producto o categoría' : activeTab === 'categories' ? 'ID o nombre de categoría' : 'ID de cliente'}
                type="search"
                value={search}
              />
            </span>
          </label>
          {activeTab === 'products' ? (
            <label>
              Estado de catálogo
              <select onChange={(event) => setProductFilter(event.target.value as ProductFilter)} value={productFilter}>
                <option value="all">Todos</option>
                <option value="with-category">Con categoría</option>
                <option value="without-category">Sin categoría</option>
              </select>
            </label>
          ) : null}
        </div>

        <div className="catalog-summary-row">
          <span>{formatNumber(total)} registros disponibles</span>
          {activeTab === 'categories' ? <span>Las categorías muestran solo cruces válidos; la cobertura sin categoría se reporta aparte.</span> : null}
        </div>

        {loading ? <LoadingState label="Cargando catálogo..." /> : activeTab === 'products' ? renderProducts() : activeTab === 'categories' ? renderCategories() : renderClients()}

        <div className="pagination-row">
          <button disabled={!canGoBack} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} type="button">
            <ChevronLeft aria-hidden="true" size={17} />
            Anterior
          </button>
          <span>
            {formatNumber(offset + 1)}-{formatNumber(Math.min(offset + PAGE_SIZE, total))} de {formatNumber(total)}
          </span>
          <button disabled={!canGoForward} onClick={() => setOffset(offset + PAGE_SIZE)} type="button">
            Siguiente
            <ChevronRight aria-hidden="true" size={17} />
          </button>
        </div>
      </section>

      {selectedProduct ? (
        <section className="detail-panel">
          <div>
            <span className="eyebrow">Detalle de producto</span>
            <h2>{productName(selectedProduct)}</h2>
            <p>{selectedProduct.categoria ?? selectedProduct.nota_catalogo ?? 'Sin categoría asociada en catálogo.'}</p>
          </div>
          <dl>
            <div><dt>ID</dt><dd>{selectedProduct.id_producto}</dd></div>
            <div><dt>Unidades</dt><dd>{formatNumber(selectedProduct.unidades_vendidas ?? selectedProduct.cantidad ?? 0)}</dd></div>
            <div><dt>Transacciones</dt><dd>{formatNumber(selectedProduct.transacciones ?? selectedProduct.frecuencia ?? 0)}</dd></div>
            <div><dt>Clientes únicos</dt><dd>{formatNumber(selectedProduct.clientes_unicos ?? 0)}</dd></div>
          </dl>
        </section>
      ) : null}

      {selectedClient ? (
        <section className="detail-panel">
          <div>
            <span className="eyebrow">Detalle de cliente</span>
            <h2>{clientName(selectedClient)}</h2>
            <p>{selectedClient.interpretacion_segmento ?? 'Cliente sin interpretación de segmento disponible.'}</p>
          </div>
          <dl>
            <div><dt>Transacciones</dt><dd>{formatNumber(selectedClient.transacciones ?? selectedClient.compras ?? 0)}</dd></div>
            <div><dt>Volumen</dt><dd>{formatNumber(selectedClient.volumen_total ?? 0)}</dd></div>
            <div><dt>Productos distintos</dt><dd>{formatNumber(selectedClient.productos_distintos ?? 0)}</dd></div>
            <div><dt>Categorías distintas</dt><dd>{formatNumber(selectedClient.categorias_distintas ?? 0)}</dd></div>
          </dl>
          <button onClick={() => navigate(`/recomendador?cliente=${encodeURIComponent(selectedClient.id_cliente)}`)} type="button">
            Abrir recomendador
          </button>
        </section>
      ) : null}
    </div>
  )
}
