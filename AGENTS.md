# AGENTS.md

## Proyecto

SAT: Supermarket Analytics & Transactions es una plataforma analitica para procesar transacciones de supermercado, calcular resultados descriptivos, segmentar clientes, recomendar productos y exponer todo en un dashboard web.

El notebook `notebooks/proyectoPDD.ipynb` es exploracion inicial. La solucion final debe vivir en codigo modular: pipeline, backend API y frontend.

## Arquitectura

```text
supermercado-analytics/
  data/
    raw/
    processed/
    results/
    quarantine/
  pipeline/
  backend/
    app/
      routers/
      services/
      schemas/
  frontend/
  notebooks/
  requirements.txt
  README.md
  AGENTS.md
```

## Comandos

```bash
pip install -r requirements.txt
python -m pipeline.run_pipeline
uvicorn backend.app.main:app --reload

cd frontend
npm install
npm run dev
npm run build
```

## Reglas de arquitectura

- No usar rutas de Google Colab como `/content`.
- Usar `pathlib.Path` para rutas portables.
- Los nuevos datos entran por `data/raw` y se procesan con `python -m pipeline.run_pipeline`.
- El frontend consume la API FastAPI; no lee CSV locales ni implementa carga de archivos como flujo principal.
- El backend lee desde `data/results`.
- El pipeline debe separar ingesta, validacion, transformacion, descriptivos, segmentacion y recomendador.
- No bypasses capas ni mezcles logica de pipeline dentro del frontend.

## Reglas de datos

- No hardcodear resultados, metricas, clusters ni recomendaciones.
- Validar columnas minimas y guardar reportes en `data/quarantine` si faltan columnas criticas.
- No calcular ingresos ni rentabilidad si no hay precios.
- Si faltan datos/resultados, responder con estados claros y mensajes utiles.

## Diseno visual

- Dashboard light premium, ejecutivo y profesional.
- Sidebar izquierda, header superior, cards, graficas limpias, estados de carga/error/vacio.
- Evitar Bootstrap viejo y estilos inline desordenados.

## Definition of Done

- `python -m pipeline.run_pipeline` corre y deja metadata clara.
- `uvicorn backend.app.main:app --reload` puede importar la app.
- `npm install` funciona en `frontend/`.
- `npm run build` pasa.
- `README.md` queda actualizado.
- Frontend consume API y no carga archivos del usuario final.
