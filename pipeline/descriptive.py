import pandas as pd

from .config import RESULTS_DIR
from .utils import normalize_column_name, records, safe_number, write_json

WEEKDAY_ORDER = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
WEEKDAY_MAP = {
    "Monday": "Lunes",
    "Tuesday": "Martes",
    "Wednesday": "Miércoles",
    "Thursday": "Jueves",
    "Friday": "Viernes",
    "Saturday": "Sábado",
    "Sunday": "Domingo",
}


def _is_missing_category(series: pd.Series) -> pd.Series:
    normalized = series.fillna("").astype(str).str.strip().map(normalize_column_name)
    return normalized.eq("sin_categoria") | normalized.eq("")


def customer_features(transactions: pd.DataFrame) -> pd.DataFrame:
    features = transactions.groupby("id_cliente").agg(
        frecuencia=("id_transaccion", "nunique"),
        cantidad_total=("cantidad", "sum"),
        volumen_total=("cantidad", "sum"),
        productos_distintos=("id_producto", "nunique"),
        sucursales_distintas=("sucursal", "nunique"),
        categorias_distintas=("categoria", "nunique"),
    )

    products_per_transaction = transactions.groupby(["id_cliente", "id_transaccion"])["cantidad"].sum().reset_index()
    average_per_customer = (
        products_per_transaction.groupby("id_cliente")["cantidad"]
        .mean()
        .reset_index()
        .rename(columns={"cantidad": "cantidad_promedio_por_transaccion"})
    )

    features = features.reset_index().merge(average_per_customer, on="id_cliente", how="left")
    features["cantidad_promedio"] = features["cantidad_promedio_por_transaccion"]
    return features


def correlation_matrix(features: pd.DataFrame) -> list[dict[str, object]]:
    numeric = features.drop(columns=["id_cliente"], errors="ignore").select_dtypes(include="number")
    numeric = numeric.loc[:, numeric.nunique(dropna=True) > 1]
    if numeric.empty:
        return []
    corr = numeric.corr().round(4).reset_index().rename(columns={"index": "variable"})
    corr = corr.replace([float("inf"), float("-inf")], pd.NA).where(pd.notna(corr), None)
    return records(corr)


def _first_valid(values: pd.Series) -> object:
    valid = values.dropna().astype(str).str.strip()
    valid = valid[valid.ne("")]
    return valid.iloc[0] if not valid.empty else None


def _first_valid_category(values: pd.Series) -> object:
    valid = values.dropna().astype(str).str.strip()
    valid = valid[~_is_missing_category(valid)]
    return valid.iloc[0] if not valid.empty else None


def generate_product_lookup(transactions: pd.DataFrame, top_product_ids: set[str]) -> list[dict[str, object]]:
    grouped = transactions.groupby("id_producto").agg(
        categoria_id=("categoria_id", _first_valid),
        categoria=("categoria", _first_valid_category),
        unidades_vendidas=("cantidad", "sum"),
        transacciones=("id_transaccion", "nunique"),
        clientes_unicos=("id_cliente", "nunique"),
    ).reset_index()
    grouped["producto_label"] = grouped["id_producto"].map(lambda value: f"Producto {value}")
    grouped["tiene_categoria"] = grouped["categoria"].notna()
    grouped["es_top_producto"] = grouped["id_producto"].astype(str).isin(top_product_ids)
    grouped["nota_catalogo"] = grouped["tiene_categoria"].map(
        lambda value: None if value else "Producto presente en transacciones sin cruce de categoría en ProductCategory."
    )
    grouped = grouped[
        [
            "id_producto",
            "producto_label",
            "categoria_id",
            "categoria",
            "tiene_categoria",
            "unidades_vendidas",
            "transacciones",
            "clientes_unicos",
            "es_top_producto",
            "nota_catalogo",
        ]
    ].sort_values(["unidades_vendidas", "transacciones"], ascending=False)
    return records(grouped)


def generate_category_lookup(transactions: pd.DataFrame, coverage: dict[str, object] | None = None) -> list[dict[str, object]]:
    valid = transactions[~_is_missing_category(transactions["categoria"])].copy()
    if valid.empty:
        return []

    total_valid_units = valid["cantidad"].sum()
    grouped = valid.groupby("categoria").agg(
        categoria_id=("categoria_id", _first_valid),
        productos_asociados=("id_producto", "nunique"),
        unidades_vendidas=("cantidad", "sum"),
        transacciones=("id_transaccion", "nunique"),
    ).reset_index()
    grouped["porcentaje_relativo"] = (grouped["unidades_vendidas"] / total_valid_units * 100).round(4)
    if coverage:
        grouped["lineas_sin_categoria"] = coverage.get("lineas_sin_categoria")
        grouped["porcentaje_sin_categoria"] = coverage.get("porcentaje_sin_categoria")
    columns = [
        "categoria_id",
        "categoria",
        "productos_asociados",
        "unidades_vendidas",
        "transacciones",
        "porcentaje_relativo",
    ]
    if coverage:
        columns.extend(["lineas_sin_categoria", "porcentaje_sin_categoria"])
    grouped = grouped[columns].sort_values(["unidades_vendidas", "transacciones"], ascending=False)
    return records(grouped)


def generate_descriptive_results(transactions: pd.DataFrame, category_coverage: dict[str, object] | None = None) -> dict[str, object]:
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    top_product_series = transactions.groupby("id_producto")["cantidad"].sum().sort_values(ascending=False)
    top_client_series = transactions.groupby("id_cliente")["id_transaccion"].nunique().sort_values(ascending=False)
    peak_day_series = transactions.groupby("fecha")["id_transaccion"].nunique().sort_values(ascending=False)
    valid_category_mask = ~_is_missing_category(transactions["categoria"])

    summary = {
        "total_units": safe_number(transactions["cantidad"].sum()),
        "total_transactions": int(transactions["id_transaccion"].nunique()),
        "total_customers": int(transactions["id_cliente"].nunique()),
        "total_products": int(transactions["id_producto"].nunique()),
        "total_categories": int(transactions.loc[valid_category_mask, "categoria"].nunique()),
        "date_min": str(transactions["fecha"].min()),
        "date_max": str(transactions["fecha"].max()),
        "top_product_id": str(top_product_series.index[0]) if not top_product_series.empty else None,
        "top_client_id": str(top_client_series.index[0]) if not top_client_series.empty else None,
        "peak_day": str(peak_day_series.index[0]) if not peak_day_series.empty else None,
        "records_count": int(len(transactions)),
        "transactions_count": int(transactions["id_transaccion"].nunique()),
        "clients_count": int(transactions["id_cliente"].nunique()),
        "products_count": int(transactions["id_producto"].nunique()),
    }

    product_category = transactions.groupby("id_producto")["categoria"].agg(
        lambda values: values.dropna().mode().iloc[0] if not values.dropna().mode().empty else "Sin categoría"
    )
    top_products = transactions.groupby("id_producto").agg(
        cantidad=("cantidad", "sum"),
        frecuencia=("id_transaccion", "nunique"),
    ).join(product_category).sort_values(["cantidad", "frecuencia"], ascending=False).head(10).reset_index()

    top_clients = transactions.groupby("id_cliente").agg(
        numero_transacciones=("id_transaccion", "nunique"),
        compras=("id_transaccion", "nunique"),
        volumen_total=("cantidad", "sum"),
    ).sort_values(["numero_transacciones", "volumen_total"], ascending=False).head(10).reset_index()

    peak_days = transactions.groupby("fecha").agg(
        numero_transacciones=("id_transaccion", "nunique"),
        transacciones=("id_transaccion", "nunique"),
        volumen_total=("cantidad", "sum"),
    ).sort_values(["numero_transacciones", "volumen_total"], ascending=False).reset_index()

    daily = transactions.groupby("fecha").agg(
        unidades=("cantidad", "sum"),
        valor=("cantidad", "sum"),
        transacciones=("id_transaccion", "nunique"),
    ).reset_index()

    weekly = transactions.groupby("semana").agg(
        unidades=("cantidad", "sum"),
        valor=("cantidad", "sum"),
        transacciones=("id_transaccion", "nunique"),
    ).reset_index()
    weekly["fecha"] = weekly["semana"]

    valid_category_transactions = transactions[valid_category_mask].copy()
    valid_units_total = valid_category_transactions["cantidad"].sum()
    categories = valid_category_transactions.groupby("categoria").agg(
        cantidad=("cantidad", "sum"),
        frecuencia=("id_transaccion", "nunique"),
    ).sort_values(["cantidad", "frecuencia"], ascending=False).head(10).reset_index()
    categories["porcentaje_relativo"] = (
        categories["cantidad"] / valid_units_total * 100 if valid_units_total else 0
    ).round(4)

    weekday_base = transactions.copy()
    weekday_base["nombre_dia_semana"] = pd.to_datetime(weekday_base["fecha"], errors="coerce").dt.day_name().map(WEEKDAY_MAP)
    weekday_base["nombre_dia_semana"] = pd.Categorical(
        weekday_base["nombre_dia_semana"],
        categories=WEEKDAY_ORDER,
        ordered=True,
    )
    weekday_transactions = (
        weekday_base.groupby("nombre_dia_semana", observed=False)
        .agg(numero_transacciones=("id_transaccion", "nunique"), transacciones=("id_transaccion", "nunique"))
        .reset_index()
        .rename(columns={"nombre_dia_semana": "dia_semana"})
    )
    weekday_units = (
        weekday_base.groupby("nombre_dia_semana", observed=False)
        .agg(unidades=("cantidad", "sum"), cantidad=("cantidad", "sum"))
        .reset_index()
        .rename(columns={"nombre_dia_semana": "dia_semana"})
    )

    features = customer_features(transactions)
    corr = correlation_matrix(features)
    top_product_ids = set(top_products["id_producto"].astype(str))

    payloads = {
        "summary.json": summary,
        "top_products.json": records(top_products),
        "top_clients.json": records(top_clients),
        "peak_days.json": records(peak_days),
        "daily_series.json": records(daily),
        "weekly_series.json": records(weekly),
        "categories.json": records(categories),
        "customer_features.json": records(features),
        "correlation_matrix.json": corr,
        "weekday_transactions.json": records(weekday_transactions),
        "weekday_units.json": records(weekday_units),
        "category_coverage.json": category_coverage or {},
        "product_lookup.json": generate_product_lookup(transactions, top_product_ids),
        "category_lookup.json": generate_category_lookup(transactions, category_coverage),
    }

    for filename, payload in payloads.items():
        write_json(RESULTS_DIR / filename, payload)

    return {
        "summary": summary,
        "customer_features": features,
        "generated_files": list(payloads),
        "top_categories": records(categories),
    }
