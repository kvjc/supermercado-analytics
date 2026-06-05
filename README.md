# SAT: Supermarket Analytics & Transactions

SAT es una plataforma analitica funcional para procesar transacciones de supermercado, transformar datos a un modelo canonico, calcular metricas descriptivas, segmentar clientes, recomendar productos y mostrar resultados en un dashboard web.

El notebook `notebooks/proyectoPDD.ipynb` se conserva como exploracion inicial. La solucion final queda organizada como pipeline de datos, backend FastAPI y frontend React.

## Arquitectura

```text
supermercado-analytics/
  data/
    raw/
    processed/
    results/
    quarantine/
  pipeline/
    ingest.py
    validate.py
    transform.py
    descriptive.py
    segmentation.py
    recommender.py
    run_pipeline.py
  backend/
    app/
      main.py
      routers/
      services/
      schemas/
  frontend/
  notebooks/
  requirements.txt
```

## Flujo de datos

1. Un operador copia un CSV o ZIP con CSV a `data/raw`.
2. Se ejecuta el pipeline.
3. El pipeline valida columnas, transforma al modelo canonico y guarda resultados.
4. FastAPI expone los resultados desde `data/results`.
5. El dashboard consulta la API y muestra resultados actualizados.

Modelo canonico:

```text
id_transaccion | fecha | sucursal | id_cliente | id_producto | categoria | cantidad
```

## Ejecutar pipeline

```bash
pip install -r requirements.txt
python -m pipeline.run_pipeline
```

Resultados:

- `data/processed/transactions_processed.csv`
- `data/results/summary.json`
- `data/results/top_products.json`
- `data/results/top_clients.json`
- `data/results/peak_days.json`
- `data/results/daily_series.json`
- `data/results/weekly_series.json`
- `data/results/categories.json`
- `data/results/customer_features.json`
- `data/results/correlation_matrix.json`
- `data/results/customer_segments.json`
- `data/results/segment_profiles.json`
- `data/results/product_recommendations.json`
- `data/results/client_recommendations.json`
- `data/results/metadata.json`

## Ejecutar backend

```bash
uvicorn backend.app.main:app --reload
```

Endpoints principales:

- `GET /health`
- `GET /summary`
- `GET /top-products`
- `GET /top-clients`
- `GET /peak-days`
- `GET /time-series/daily`
- `GET /time-series/weekly`
- `GET /categories`
- `GET /correlations`
- `GET /segmentation/customers`
- `GET /segmentation/profiles`
- `GET /recommendations/product/{product_id}`
- `GET /recommendations/client/{client_id}`
- `GET /metadata/last-update`

## Ejecutar frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend usa por defecto `http://127.0.0.1:8000`. Para cambiarlo:

```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

## Incorporar nuevos datos

1. Copiar archivo a `data/raw`.
2. Ejecutar:

```bash
python -m pipeline.run_pipeline
```

3. Refrescar el dashboard.

El usuario final no carga archivos desde el dashboard. La incorporacion se realiza por proceso tecnico controlado.

## Notas para sustentacion

- La solucion no depende de rutas de Colab.
- El pipeline usa rutas portables con `pathlib`.
- El frontend consume API, no archivos locales.
- No hay metricas falsas hardcodeadas.
- La segmentacion usa K-Means sobre features de cliente.
- El recomendador usa co-ocurrencia de productos por transaccion.
- Si faltan archivos o resultados, la API y el frontend muestran estados claros.
