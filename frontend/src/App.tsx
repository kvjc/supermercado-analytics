import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { AnalyticalVisualizationsPage } from './pages/AnalyticalVisualizationsPage'
import { CatalogsPage } from './pages/CatalogsPage'
import { CustomerSegmentationPage } from './pages/CustomerSegmentationPage'
import { ExecutiveSummaryPage } from './pages/ExecutiveSummaryPage'
import { MetadataPage } from './pages/MetadataPage'
import { ProductRecommenderPage } from './pages/ProductRecommenderPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route element={<ExecutiveSummaryPage />} index />
          <Route element={<AnalyticalVisualizationsPage />} path="visualizaciones" />
          <Route element={<CatalogsPage />} path="catalogos" />
          <Route element={<CustomerSegmentationPage />} path="segmentacion" />
          <Route element={<ProductRecommenderPage />} path="recomendador" />
          <Route element={<MetadataPage />} path="actualizacion" />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
