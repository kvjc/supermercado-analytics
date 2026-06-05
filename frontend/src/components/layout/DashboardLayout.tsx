import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function DashboardLayout() {
  return (
    <div className="dashboard-shell">
      <Sidebar />
      <div className="dashboard-main">
        <Header />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
