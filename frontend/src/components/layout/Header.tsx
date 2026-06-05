import { Database, ShieldCheck } from 'lucide-react'

export function Header() {
  return (
    <header className="topbar">
      <div>
        <span className="eyebrow">Business Intelligence</span>
        <h1>Analítica transaccional de supermercado</h1>
      </div>
      <div className="topbar__badges">
        <span>
          <Database aria-hidden="true" size={16} />
          API conectada
        </span>
        <span>
          <ShieldCheck aria-hidden="true" size={16} />
          Pipeline controlado
        </span>
      </div>
    </header>
  )
}
