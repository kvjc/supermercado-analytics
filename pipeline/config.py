from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
RESULTS_DIR = DATA_DIR / "results"
QUARANTINE_DIR = DATA_DIR / "quarantine"

CANONICAL_COLUMNS = [
    "id_transaccion",
    "fecha",
    "sucursal",
    "id_cliente",
    "id_producto",
    "categoria",
    "cantidad",
]

COLUMN_ALIASES = {
    "id_transaccion": ["id_transaccion", "transaction_id", "transaction", "transaccion", "ticket_id"],
    "fecha": ["fecha", "date", "transaction_date", "dia"],
    "sucursal": ["sucursal", "store", "store_id", "branch", "tienda"],
    "id_cliente": ["id_cliente", "customer_id", "customer", "cliente", "client_id"],
    "id_producto": ["id_producto", "product_id", "product", "producto", "item_id"],
    "categoria": ["categoria", "category", "categoria_nombre", "category_name", "department"],
    "cantidad": ["cantidad", "quantity", "qty", "units", "unidades"],
}

CRITICAL_COLUMNS = ["id_transaccion", "fecha", "id_cliente", "id_producto", "cantidad"]

DEFAULT_K = 3

