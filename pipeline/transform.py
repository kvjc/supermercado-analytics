import pandas as pd

from .config import PROCESSED_DIR


def _clean_id(series: pd.Series) -> pd.Series:
    return series.astype(str).str.strip().str.replace(r"\.0$", "", regex=True)


def build_transaction_lines(
    raw_transactions: pd.DataFrame,
    product_categories: pd.DataFrame | None = None,
    categories: pd.DataFrame | None = None,
) -> tuple[pd.DataFrame, pd.DataFrame, dict[str, float | int | str]]:
    transactions = raw_transactions.copy()
    transactions["fecha"] = pd.to_datetime(transactions["fecha"], errors="coerce")
    transactions["sucursal"] = _clean_id(transactions["sucursal"])
    transactions["id_cliente"] = _clean_id(transactions["id_cliente"])
    transactions["productos"] = transactions["productos"].astype(str).str.strip()
    transactions["id_transaccion"] = [
        f"{source_file}::TRN_{index}" for index, source_file in enumerate(transactions["source_file"].astype(str))
    ]

    transactions["id_producto"] = transactions["productos"].str.split()
    transaction_lines = transactions.explode("id_producto", ignore_index=True)
    transaction_lines["id_producto"] = _clean_id(transaction_lines["id_producto"])
    transaction_lines["cantidad"] = 1

    invalid_mask = (
        transaction_lines["fecha"].isna()
        | transaction_lines["id_producto"].isna()
        | transaction_lines["id_producto"].eq("")
        | transaction_lines["id_producto"].str.lower().isin(["nan", "none"])
    )
    invalid = transaction_lines.loc[invalid_mask].copy()
    transaction_lines = transaction_lines.loc[~invalid_mask].copy()

    transaction_lines = transaction_lines[
        ["id_transaccion", "fecha", "sucursal", "id_cliente", "id_producto", "cantidad"]
    ]

    base_rows_before_merge = int(len(transaction_lines))
    coverage: dict[str, float | int | str] = {
        "total_lineas": base_rows_before_merge,
        "lineas_con_categoria": 0,
        "lineas_sin_categoria": base_rows_before_merge,
        "porcentaje_con_categoria": 0.0,
        "porcentaje_sin_categoria": 100.0,
        "productos_con_multiples_categorias": 0,
        "filas_product_category_original": 0,
        "productos_unicos_product_category": 0,
        "filas_product_category_deduplicado": 0,
        "filas_base_antes_merge": base_rows_before_merge,
        "filas_despues_merge": base_rows_before_merge,
        "diferencia_filas_merge": 0,
        "regla_deduplicacion": "Sin catálogo ProductCategory disponible.",
    }

    if product_categories is not None and not product_categories.empty:
        product_catalog = product_categories.copy()
        product_catalog["id_producto"] = _clean_id(product_catalog["id_producto"])
        product_catalog["categoria_id"] = _clean_id(product_catalog["categoria_id"])
        product_catalog = product_catalog.sort_values(["id_producto", "categoria_id"])

        original_rows = int(len(product_catalog))
        unique_products = int(product_catalog["id_producto"].nunique())
        products_with_multiple_categories = int(
            (product_catalog.groupby("id_producto")["categoria_id"].nunique() > 1).sum()
        )
        product_catalog = product_catalog.drop_duplicates(subset=["id_producto"], keep="first")
        deduplicated_rows = int(len(product_catalog))

        print(f"ProductCategory original: {original_rows} filas")
        print(f"Productos únicos en ProductCategory: {unique_products}")
        print(f"Productos con múltiples categorías: {products_with_multiple_categories}")
        print(f"ProductCategory deduplicado: {deduplicated_rows} filas")
        print("Regla usada: se conserva la primera categoría ordenada por categoria_id para evitar duplicación many-to-many")

        coverage.update(
            {
                "filas_product_category_original": original_rows,
                "productos_unicos_product_category": unique_products,
                "productos_con_multiples_categorias": products_with_multiple_categories,
                "filas_product_category_deduplicado": deduplicated_rows,
                "regla_deduplicacion": "Se conserva la primera categoría ordenada por categoria_id para evitar duplicación many-to-many.",
            }
        )

        transaction_lines = transaction_lines.merge(product_catalog, on="id_producto", how="left")

        if categories is not None and not categories.empty:
            category_catalog = categories.copy()
            category_catalog["categoria_id"] = _clean_id(category_catalog["categoria_id"])
            category_catalog["categoria_nombre"] = category_catalog["categoria_nombre"].astype(str).str.strip()
            transaction_lines = transaction_lines.merge(category_catalog, on="categoria_id", how="left")

        rows_after_merge = int(len(transaction_lines))
        row_difference = rows_after_merge - base_rows_before_merge
        print(f"Filas base explotadas antes del merge: {base_rows_before_merge}")
        print(f"Filas después del merge con categorías: {rows_after_merge}")
        print(f"Diferencia de filas por merge: {row_difference}")
        if row_difference != 0:
            raise ValueError("El merge con categorías infló filas. Revise la deduplicación de ProductCategory.")

        matched_lines = int(transaction_lines["categoria_id"].notna().sum())
        unmatched_lines = rows_after_merge - matched_lines
        matched_percentage = float(matched_lines / rows_after_merge * 100) if rows_after_merge else 0.0
        unmatched_percentage = 100 - matched_percentage
        coverage.update(
            {
                "total_lineas": rows_after_merge,
                "lineas_con_categoria": matched_lines,
                "lineas_sin_categoria": unmatched_lines,
                "porcentaje_con_categoria": matched_percentage,
                "porcentaje_sin_categoria": unmatched_percentage,
                "filas_base_antes_merge": base_rows_before_merge,
                "filas_despues_merge": rows_after_merge,
                "diferencia_filas_merge": row_difference,
            }
        )
        transaction_lines["categoria"] = transaction_lines.get("categoria_nombre", pd.Series(index=transaction_lines.index)).fillna(
            "Sin categoría"
        )
    else:
        transaction_lines["categoria_id"] = None
        transaction_lines["categoria"] = "Sin categoría"

    transaction_lines["fecha"] = pd.to_datetime(transaction_lines["fecha"], errors="coerce")
    transaction_lines["dia"] = transaction_lines["fecha"].dt.date.astype(str)
    transaction_lines["semana"] = transaction_lines["fecha"].dt.to_period("W").astype(str)
    transaction_lines["mes"] = transaction_lines["fecha"].dt.month
    transaction_lines["anio"] = transaction_lines["fecha"].dt.year
    transaction_lines["dia_semana"] = transaction_lines["fecha"].dt.day_name()
    transaction_lines["fecha"] = transaction_lines["fecha"].dt.date.astype(str)

    columns = [
        "id_transaccion",
        "fecha",
        "sucursal",
        "id_cliente",
        "id_producto",
        "categoria_id",
        "categoria",
        "cantidad",
        "dia",
        "semana",
        "mes",
        "anio",
        "dia_semana",
    ]
    return transaction_lines[columns], invalid, coverage


def save_processed(df: pd.DataFrame) -> list[str]:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    generated = []
    csv_path = PROCESSED_DIR / "transactions_processed.csv"
    df.to_csv(csv_path, index=False)
    generated.append(str(csv_path))

    try:
        parquet_path = PROCESSED_DIR / "transactions_processed.parquet"
        df.to_parquet(parquet_path, index=False)
        generated.append(str(parquet_path))
    except Exception as exc:
        print(f"Parquet no disponible, se conserva fallback CSV: {exc}")

    return generated
