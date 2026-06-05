# Informe Técnico  
## Plataforma SAT: Supermarket Analytics & Transactions

**Proyecto:** Análisis y Modelado Analítico de Transacciones de Supermercado  
**Autores:** Isabella Hernández y Karen Valeria Jurado  

---

## 1. Introducción

El presente informe describe el desarrollo de **SAT (Supermarket Analytics & Transactions)**, una plataforma analítica diseñada para procesar, analizar y visualizar transacciones de supermercado.

El objetivo principal del proyecto es construir una solución tecnológica funcional que permita analizar el comportamiento de compra de los clientes a partir de datos transaccionales. Para ello, se desarrolló una arquitectura compuesta por un pipeline de procesamiento de datos, una API backend y un dashboard web interactivo.

La solución no se limita a un notebook exploratorio. El proyecto transforma los datos originales, genera resultados analíticos, expone dichos resultados mediante una API y los presenta en un dashboard orientado a la toma de decisiones.

---

## 2. Descripción de los datos

El dataset utilizado contiene información transaccional de supermercado. Los datos originales se encuentran en un archivo comprimido `DataSet.zip`, el cual incluye archivos de transacciones y catálogos asociados a productos y categorías.

La estructura original de las transacciones no venía directamente en formato analítico. Cada transacción contenía una lista de productos comprados. Por esta razón, fue necesario transformar los datos a un modelo canónico, donde cada fila representa un producto comprado dentro de una transacción.

### 2.1 Estructura original

La estructura base de las transacciones puede resumirse así:

```txt
fecha | sucursal | id_cliente | listado_productos_comprados
````

Cada registro representa una transacción, pero el campo de productos contiene varios productos dentro de una misma celda.

### 2.2 Modelo canónico construido

Para facilitar el análisis, el sistema transforma los datos al siguiente modelo:

```txt
id_transaccion | fecha | sucursal | id_cliente | id_producto | categoria | cantidad
```

Cada fila del modelo canónico representa un producto dentro de una transacción. Esto permite calcular métricas como unidades vendidas, número de transacciones, productos más comprados, clientes más frecuentes, días pico, categorías relevantes y patrones de co-ocurrencia entre productos.

### 2.3 Volumen de datos procesado

Después del procesamiento, la base final no inflada contiene:

| Métrica              |                   Valor |
| -------------------- | ----------------------: |
| Líneas procesadas    |              10.591.793 |
| Transacciones únicas |               1.108.987 |
| Clientes únicos      |                 131.186 |
| Productos únicos     |                     449 |
| Categorías válidas   |                      21 |
| Rango de fechas      | 2013-01-01 a 2013-06-30 |

Cada línea procesada representa un producto comprado. Dado que el dataset no contiene precios ni montos de pago, el análisis se basa en métricas relativas como volumen, frecuencia, diversidad de productos y comportamiento de compra.

---

## 3. Arquitectura de la solución

La plataforma SAT fue construida siguiendo una arquitectura analítica por capas. Esta decisión permite separar responsabilidades entre ingesta, procesamiento, almacenamiento, API y visualización.

El flujo general implementado es:

```txt
data/raw
   ↓
pipeline de procesamiento
   ↓
data/processed
   ↓
data/results
   ↓
FastAPI backend
   ↓
React + Vite dashboard
```

### 3.1 Capas principales

| Capa                     | Descripción                                                           |
| ------------------------ | --------------------------------------------------------------------- |
| Fuentes de datos         | Archivos originales ubicados en `data/raw`.                           |
| Ingesta                  | Lectura de archivos ZIP y CSV.                                        |
| Validación               | Revisión de estructura, tipos y consistencia de los datos.            |
| Transformación           | Conversión de transacciones al modelo canónico por línea de producto. |
| Almacenamiento procesado | Datos limpios almacenados en `data/processed`.                        |
| Motor analítico          | Cálculo de métricas descriptivas, segmentación y recomendaciones.     |
| Resultados analíticos    | Archivos JSON generados en `data/results`.                            |
| API Backend              | Endpoints FastAPI para exponer los resultados.                        |
| Dashboard Web            | Interfaz React + Vite para visualización e interacción.               |

Esta arquitectura permite que los resultados se recalculen cuando se incorporan nuevos datos, sin necesidad de modificar manualmente el frontend.

---

## 4. Metodología de análisis

La metodología se desarrolló en cinco etapas principales:

1. Ingesta de datos.
2. Transformación al modelo canónico.
3. Validación y control de calidad.
4. Análisis descriptivo y visual.
5. Modelado avanzado mediante segmentación y recomendación.

---

### 4.1 Ingesta de datos

El pipeline lee el archivo `DataSet.zip` ubicado en `data/raw`. Dentro del archivo comprimido se identifican los archivos de transacciones y los catálogos relacionados con productos y categorías.

Los archivos de transacciones se leen, se concatenan y se procesan como una única base histórica de compras.

---

### 4.2 Transformación al modelo canónico

Cada transacción original contenía una lista de productos. Para convertirla en una estructura analítica, se aplicó el siguiente proceso:

1. Separar la lista de productos comprados.
2. Generar una fila por cada producto dentro de la transacción.
3. Asignar `cantidad = 1` por cada aparición de producto.
4. Crear un identificador único de transacción.
5. Enriquecer las líneas con información de categoría cuando existía cruce con el catálogo.
6. Guardar la base procesada para ser utilizada por los módulos analíticos.

Este proceso permitió pasar de una estructura transaccional compacta a una base granular apta para análisis.

---

### 4.3 Validación del catálogo de categorías

Durante la validación se encontró que el catálogo `ProductCategory` no tenía una relación uno a uno. Es decir, algunos productos estaban asociados a más de una categoría.

| Métrica                               |   Valor |
| ------------------------------------- | ------: |
| Filas originales en `ProductCategory` | 112.010 |
| Productos únicos en `ProductCategory` |  69.891 |
| Productos con múltiples categorías    |  23.646 |

Un merge directo entre las transacciones y `ProductCategory` generaba una relación many-to-many, lo que multiplicaba filas y producía una sobreestimación de las métricas.

Para evitar este problema, se deduplicó el catálogo por `id_producto`, conservando una categoría principal de forma determinística. Después de esta corrección, el merge dejó de inflar filas:

| Validación                             |      Valor |
| -------------------------------------- | ---------: |
| Filas antes del merge con categorías   | 10.591.793 |
| Filas después del merge con categorías | 10.591.793 |
| Diferencia                             |          0 |

Esta decisión permitió mantener consistencia entre los totales generales, los rankings y los modelos analíticos.

---

### 4.4 Cobertura del catálogo

También se identificó que varios productos presentes en las transacciones no existían en el catálogo `ProductCategory`.

| Métrica                                       |     Valor |
| --------------------------------------------- | --------: |
| Productos únicos en transacciones             |       449 |
| Productos que sí existen en `ProductCategory` |       243 |
| Productos que no existen en `ProductCategory` |       206 |
| Líneas con categoría                          | 5.260.993 |
| Líneas sin categoría                          | 5.330.800 |
| Porcentaje con categoría                      |    49,67% |
| Porcentaje sin categoría                      |    50,33% |

Los productos sin categoría no fueron eliminados. Se conservan en la base procesada y en las métricas generales, pero no se incluyen en el ranking principal de categorías, ya que “Sin categoría” no representa una categoría comercial sino una ausencia de clasificación en el catálogo.

---

## 5. Análisis descriptivo

A partir de la base procesada se generaron métricas descriptivas para entender el comportamiento general del supermercado.

### 5.1 Resumen ejecutivo

| Indicador                 |      Resultado |
| ------------------------- | -------------: |
| Unidades vendidas         |     10.591.793 |
| Transacciones registradas |      1.108.987 |
| Clientes únicos           |        131.186 |
| Productos únicos          |            449 |
| Producto más vendido      |     Producto 5 |
| Cliente más frecuente     | Cliente 336296 |
| Día pico                  |     2013-06-15 |

Estos indicadores permiten obtener una visión general del volumen de actividad transaccional.

---

### 5.2 Productos más comprados

El producto con mayor volumen fue el **Producto 5**, con aproximadamente **300.526 unidades vendidas**.

El ranking de productos permite identificar cuáles artículos concentran mayor movimiento dentro del supermercado. Este análisis puede ser útil para inventario, abastecimiento, promociones y priorización comercial.

---

### 5.3 Clientes con mayor frecuencia

El cliente más frecuente fue el **Cliente 336296**, con **535 transacciones**.

Este análisis permite identificar clientes con alta recurrencia, lo cual puede servir para estrategias de fidelización, segmentación comercial y personalización de ofertas.

---

### 5.4 Días pico

El análisis temporal permitió identificar fechas con mayor número de transacciones. El día con mayor actividad fue:

| Indicador                  |  Resultado |
| -------------------------- | ---------: |
| Día pico                   | 2013-06-15 |
| Transacciones del día pico |      9.476 |

Este hallazgo puede apoyar decisiones de planeación operativa, asignación de personal, gestión de inventario y campañas comerciales.

---

### 5.5 Categorías más relevantes

El ranking de categorías se calculó únicamente sobre productos con categoría válida. Las líneas sin categoría fueron reportadas como métrica de cobertura, pero no se incluyeron como categoría de negocio.

Top 10 categorías válidas:

| Categoría                        |  Unidades |
| -------------------------------- | --------: |
| VERDURAS RAIZ,TUBERCULO Y BULBOS | 1.811.523 |
| VERDURAS DE FRUTOS               | 1.410.750 |
| JUGOS                            |   729.513 |
| AROMATICAS CONDIMENTOS           |   493.388 |
| AROMATICAS MEDICINALES           |   294.753 |
| LEGUMBRES VERDES                 |   125.567 |
| GRUPO FRUVER-EXCEPCIONES         |   116.773 |
| LULO NACIONAL                    |    63.669 |
| CUIDADO DE LA COCINA             |    58.857 |
| AZUCAR                           |    40.827 |

La separación de los registros sin categoría evita que una ausencia de clasificación distorsione el análisis comercial.

---

### 5.6 Matriz de correlación

Se construyó una matriz de correlación para analizar relaciones entre variables numéricas del comportamiento de los clientes.

Algunas variables consideradas fueron:

* Frecuencia de compra.
* Volumen total.
* Productos distintos.
* Categorías distintas.
* Promedio de productos por transacción.

Esta visualización ayuda a identificar si los clientes que compran más también tienden a comprar mayor variedad de productos o categorías.

---

## 6. Segmentación de clientes

Se implementó un modelo de segmentación de clientes utilizando **K-Means**.

El objetivo de la segmentación fue agrupar clientes con comportamientos de compra similares, permitiendo identificar patrones de consumo y posibles grupos de valor.

---

### 6.1 Variables utilizadas

Las variables utilizadas para segmentar clientes fueron:

| Variable             | Descripción                                 |
| -------------------- | ------------------------------------------- |
| Frecuencia           | Número de transacciones del cliente.        |
| Productos distintos  | Cantidad de productos diferentes comprados. |
| Volumen total        | Total de productos comprados.               |
| Categorías distintas | Número de categorías diferentes compradas.  |
| Cantidad promedio    | Promedio de productos por transacción.      |

Antes de aplicar K-Means, las variables fueron estandarizadas mediante `StandardScaler`. Esto evita que variables con escalas más grandes dominen el agrupamiento.

---

### 6.2 Resultado general

| Resultado            |   Valor |
| -------------------- | ------: |
| Clientes segmentados | 131.186 |
| Número de segmentos  |       3 |

El modelo generó tres grupos de clientes con comportamientos diferenciados.

---

### 6.3 Interpretación de segmentos

La interpretación de los segmentos debe realizarse a partir de los perfiles promedio generados por el sistema. En términos generales, los segmentos pueden entenderse así:

| Segmento   | Interpretación general                                           |
| ---------- | ---------------------------------------------------------------- |
| Segmento 0 | Clientes de menor frecuencia o menor volumen de compra.          |
| Segmento 1 | Clientes con comportamiento intermedio.                          |
| Segmento 2 | Clientes con mayor actividad, volumen o diversidad de productos. |

Esta segmentación puede utilizarse para diseñar estrategias diferenciadas de mercadeo, fidelización y análisis de comportamiento.

---

## 7. Recomendador de productos

Se implementó un recomendador basado en **co-ocurrencia de productos**.

Este enfoque identifica productos que suelen aparecer juntos dentro de las mismas transacciones. No utiliza precios, montos ni márgenes, ya que el dataset no contiene esa información.

---

### 7.1 Recomendación por producto

Dado un producto, el sistema recomienda otros productos que suelen comprarse junto con él.

Ejemplo:

| Consulta                  | Resultado   |
| ------------------------- | ----------- |
| Producto consultado       | Producto 5  |
| Recomendaciones generadas | 8 productos |
| Primera recomendación     | Producto 10 |

Este tipo de recomendación puede utilizarse para ventas cruzadas, promociones o sugerencias de productos complementarios.

---

### 7.2 Recomendación por cliente

Dado un cliente, el sistema recomienda productos relacionados con su historial de compra.

Ejemplo:

| Consulta                  | Resultado      |
| ------------------------- | -------------- |
| Cliente consultado        | Cliente 336296 |
| Recomendaciones generadas | 4 productos    |
| Primera recomendación     | Producto 268   |

Este módulo puede apoyar estrategias de personalización, campañas dirigidas y recomendaciones en canales digitales.

---

## 8. Catálogos e inventario analítico

Se agregó una sección de **Catálogos** o **Inventario** para facilitar la interpretación de los IDs utilizados en el dashboard.

Esta sección permite consultar:

1. Productos.
2. Categorías.
3. Clientes.

---

### 8.1 Catálogo de productos

El catálogo de productos permite consultar información como:

* ID del producto.
* Etiqueta del producto.
* Categoría asociada, si existe.
* Unidades vendidas.
* Transacciones.
* Clientes únicos.
* Estado del catálogo: con categoría o sin categoría.

Si el dataset no contiene nombre real del producto, el sistema utiliza una etiqueta sintética como:

```txt
Producto 5
```

y la enriquece con información analítica disponible.

---

### 8.2 Catálogo de categorías

El catálogo de categorías permite consultar:

* ID de categoría.
* Nombre de la categoría.
* Productos asociados.
* Unidades vendidas.
* Transacciones.
* Porcentaje relativo.

Esta sección también permite evidenciar la cobertura del catálogo y los productos sin clasificación.

---

### 8.3 Catálogo de clientes

El catálogo de clientes permite consultar:

* ID del cliente.
* Etiqueta del cliente.
* Segmento.
* Transacciones.
* Volumen total.
* Productos distintos.
* Categorías distintas.
* Promedio de productos por transacción.

Como el dataset no contiene nombres reales de clientes, el sistema utiliza etiquetas como:

```txt
Cliente 336296
```

Esto evita inventar información y mantiene la trazabilidad con los datos originales.

---

## 9. Incorporación de nuevos datos

La plataforma fue diseñada para actualizar los resultados cuando se incorporan nuevos archivos de transacciones. Sin embargo, esta incorporación no se realiza desde el dashboard, sino mediante un proceso técnico controlado.

Esta decisión responde a la arquitectura propuesta: el dashboard es una capa de consulta y visualización, mientras que la ingesta, validación y transformación de datos pertenecen al pipeline de procesamiento.

El flujo de actualización es el siguiente:

1. Un operador técnico ubica el nuevo archivo en la zona de datos crudos (`data/raw`).
2. Se ejecuta el pipeline de actualización.
3. El sistema valida la estructura y consistencia del archivo.
4. Los datos válidos se transforman al modelo canónico.
5. Se actualiza la base procesada en `data/processed`.
6. Se recalculan métricas, visualizaciones, segmentos y recomendaciones.
7. Los resultados se guardan en `data/results`.
8. El dashboard muestra automáticamente la información actualizada a través de la API.

Comando de ejecución:

```bash
python -m pipeline.run_pipeline

Este enfoque mantiene la reproducibilidad del análisis y evita que el frontend asuma responsabilidades de procesamiento pesado.

---

## 10. Limitaciones

Durante el desarrollo se identificaron las siguientes limitaciones:

1. El dataset no contiene precios ni montos de pago. Por esta razón, no se calculan ingresos ni rentabilidad monetaria real.
2. El catálogo de categorías está incompleto: 206 productos vendidos no tienen correspondencia en `ProductCategory`.
3. Algunas recomendaciones se basan únicamente en co-ocurrencia, por lo que no consideran precio, margen, disponibilidad ni preferencias explícitas.
4. La segmentación depende de variables transaccionales y no incorpora variables demográficas.
5. Los nombres reales de productos y clientes no están disponibles en el dataset. Por eso se utilizan etiquetas basadas en IDs.

Estas limitaciones no invalidan el análisis, pero deben tenerse en cuenta al interpretar los resultados.

---

## 11. Posibles aplicaciones empresariales

La solución desarrollada puede aplicarse en diferentes áreas del negocio.

---

### 11.1 Gestión de inventario

Identificar productos con mayor volumen de venta permite priorizar abastecimiento y reducir riesgos de quiebre de stock.

---

### 11.2 Mercadeo y promociones

Los rankings de productos, categorías y recomendaciones permiten diseñar campañas basadas en patrones reales de compra.

---

### 11.3 Fidelización de clientes

La segmentación permite identificar grupos de clientes con distintos comportamientos y diseñar estrategias diferenciadas para cada grupo.

---

### 11.4 Venta cruzada

El recomendador permite sugerir productos complementarios con base en co-ocurrencias históricas dentro de las transacciones.

---

### 11.5 Planeación operativa

El análisis de días pico ayuda a planificar personal, inventario y operación en fechas con mayor demanda.

---

### 11.6 Calidad y gobierno de datos

La cobertura del catálogo permite identificar productos sin clasificación, lo cual puede servir como insumo para mejorar la calidad de los datos internos.

---

## 12. Ejecución del proyecto

### 12.1 Ejecutar pipeline

```bash
python -m pipeline.run_pipeline
```

### 12.2 Ejecutar backend

```bash
uvicorn backend.app.main:app --reload
```

### 12.3 Ejecutar frontend

```bash
cd frontend
npm install
npm run dev
```

### 12.4 Validar build del frontend

```bash
npm run build
```

---

## 13. Conclusiones

La plataforma SAT permite transformar datos transaccionales de supermercado en información útil para la toma de decisiones.

El proyecto logró:

* Construir un pipeline reproducible de procesamiento de datos.
* Transformar datos crudos a un modelo canónico por línea de producto.
* Generar métricas descriptivas y visualizaciones analíticas.
* Implementar segmentación de clientes con K-Means.
* Implementar un recomendador de productos basado en co-ocurrencia.
* Exponer resultados mediante una API FastAPI.
* Construir un dashboard web con React + Vite.
* Agregar una sección de catálogos para interpretar productos, categorías y clientes.
* Incorporar mecanismos para actualizar los resultados con nuevos datos.

Una decisión clave del proyecto fue no replicar directamente el notebook cuando se identificó que el cruce producto-categoría inflaba filas. En su lugar, se corrigió la relación many-to-many, se mantuvo una base no inflada y se separó “Sin categoría” como indicador de calidad del catálogo.

En conclusión, SAT demuestra cómo una arquitectura analítica local-first puede convertir datos transaccionales en insights accionables para inventario, mercadeo, fidelización, recomendación y planeación operativa.
