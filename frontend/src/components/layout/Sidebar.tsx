import { BarChart3, Boxes, BrainCircuit, LayoutDashboard, PackageSearch, RefreshCw } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navigation = [
  { label: 'Resumen', path: '/', icon: LayoutDashboard },
  { label: 'Visualizaciones', path: '/visualizaciones', icon: BarChart3 },
  { label: 'Catálogos', path: '/catalogos', icon: Boxes },
  { label: 'Segmentación', path: '/segmentacion', icon: BrainCircuit },
  { label: 'Recomendador', path: '/recomendador', icon: PackageSearch },
  { label: 'Actualización', path: '/actualizacion', icon: RefreshCw },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand__mark">SA</span>
        <div>
          <strong>Supermercado Analytics</strong>
          <small>Retail Intelligence</small>
        </div>
      </div>
      <nav className="sidebar__nav" aria-label="Navegación principal">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <NavLink className={({ isActive }) => (isActive ? 'is-active' : undefined)} end={item.path === '/'} key={item.path} to={item.path}>
              <Icon aria-hidden="true" size={19} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
