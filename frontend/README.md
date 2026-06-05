# SAT Frontend

Dashboard React + Vite + TypeScript para SAT.

## Comandos

```bash
npm install
npm run dev
npm run build
```

## API

El frontend consume FastAPI desde:

```text
http://127.0.0.1:8000
```

Puede cambiarse con `VITE_API_BASE_URL`.

El dashboard no carga CSV del usuario final. Los datos nuevos entran por `data/raw` y se procesan con:

```bash
python -m pipeline.run_pipeline
```
