from pathlib import Path
from typing import Any

from pipeline.config import RESULTS_DIR
from pipeline.utils import read_json


class ResultService:
    def __init__(self, results_dir: Path = RESULTS_DIR) -> None:
        self.results_dir = results_dir
        self._cache: dict[str, tuple[float, Any]] = {}

    def _read_payload(self, filename: str, default: Any = None) -> tuple[str, Any, str | None]:
        path = self.results_dir / filename
        if not path.exists():
            return (
                "empty",
                default if default is not None else [],
                f"Resultado no disponible: {filename}. Ejecute python -m pipeline.run_pipeline.",
            )

        mtime = path.stat().st_mtime
        cached = self._cache.get(filename)
        if cached and cached[0] == mtime:
            return "success", cached[1], None

        payload = read_json(path)
        self._cache[filename] = (mtime, payload)
        return "success", payload, None

    def read_result(self, filename: str, default: Any = None) -> dict[str, Any]:
        status, data, message = self._read_payload(filename, default)
        return {"status": status, "data": data, "message": message}

    def metadata(self) -> dict[str, Any]:
        response = self.read_result("metadata.json", default={})
        if response["status"] == "empty":
            response["data"] = {
                "status": "not_run",
                "last_update": None,
                "records_processed": 0,
                "generated_files": [],
            }
        return response

    def recommendation(self, filename: str, key: str) -> dict[str, Any]:
        response = self.read_result(filename, default={})
        if response["status"] != "success":
            return response

        data = response["data"]
        return {
            "status": "success",
            "data": data.get(str(key), []),
            "message": None if str(key) in data else f"No hay recomendaciones para {key}.",
        }

    def _list_lookup(
        self,
        filename: str,
        search: str | None = None,
        limit: int = 50,
        offset: int = 0,
        fields: tuple[str, ...] = (),
        has_category: bool | None = None,
    ) -> dict[str, Any]:
        response = self.read_result(filename, default=[])
        if response["status"] != "success":
            response.update({"total": 0, "limit": limit, "offset": offset})
            return response

        items = response["data"]
        if has_category is not None:
            items = [item for item in items if bool(item.get("tiene_categoria")) is has_category]

        if search:
            needle = str(search).strip().lower()
            items = [
                item
                for item in items
                if any(needle in str(item.get(field, "")).lower() for field in fields)
            ]

        total = len(items)
        safe_limit = max(1, min(limit, 500))
        safe_offset = max(0, offset)
        return {
            "status": "success",
            "data": items[safe_offset : safe_offset + safe_limit],
            "total": total,
            "limit": safe_limit,
            "offset": safe_offset,
            "message": None,
        }

    def _find_lookup(self, filename: str, field: str, value: str) -> dict[str, Any]:
        response = self.read_result(filename, default=[])
        if response["status"] != "success":
            return response

        item = next((row for row in response["data"] if str(row.get(field)) == str(value)), None)
        if item is None:
            return {
                "status": "empty",
                "data": None,
                "message": f"No hay metadata enriquecida para {value}.",
            }
        return {"status": "success", "data": item, "message": None}

    def products_lookup(
        self,
        search: str | None = None,
        limit: int = 50,
        offset: int = 0,
        has_category: bool | None = None,
    ) -> dict[str, Any]:
        return self._list_lookup(
            "product_lookup.json",
            search=search,
            limit=limit,
            offset=offset,
            fields=("id_producto", "producto_label", "categoria"),
            has_category=has_category,
        )

    def categories_lookup(self, search: str | None = None, limit: int = 50, offset: int = 0) -> dict[str, Any]:
        return self._list_lookup(
            "category_lookup.json",
            search=search,
            limit=limit,
            offset=offset,
            fields=("categoria_id", "categoria"),
        )

    def clients_lookup(self, search: str | None = None, limit: int = 50, offset: int = 0) -> dict[str, Any]:
        return self._list_lookup(
            "client_lookup.json",
            search=search,
            limit=limit,
            offset=offset,
            fields=("id_cliente", "cliente_label"),
        )

    def product_lookup(self, product_id: str) -> dict[str, Any]:
        response = self._find_lookup("product_lookup.json", "id_producto", product_id)
        if response["status"] == "success":
            return response

        products = self.read_result("top_products.json", default=[]).get("data", [])
        found = next((item for item in products if str(item.get("id_producto")) == str(product_id)), None)
        data = {
            "id_producto": str(product_id),
            "producto_label": f"Producto {product_id}",
            "label": f"Producto {product_id}",
            "categoria": found.get("categoria") if found else None,
            "unidades_vendidas": found.get("cantidad") if found else None,
            "cantidad": found.get("cantidad") if found else None,
            "transacciones": found.get("frecuencia") if found else None,
            "frecuencia": found.get("frecuencia") if found else None,
        }
        return {"status": "success", "data": data, "message": "Producto sin lookup completo disponible."}

    def category_lookup(self, category_id: str) -> dict[str, Any]:
        return self._find_lookup("category_lookup.json", "categoria_id", category_id)

    def client_lookup(self, client_id: str) -> dict[str, Any]:
        response = self._find_lookup("client_lookup.json", "id_cliente", client_id)
        if response["status"] == "success":
            return response

        clients = self.read_result("top_clients.json", default=[]).get("data", [])
        found = next((item for item in clients if str(item.get("id_cliente")) == str(client_id)), None)
        data = {
            "id_cliente": str(client_id),
            "cliente_label": f"Cliente {client_id}",
            "label": f"Cliente {client_id}",
            "transacciones": (found or {}).get("numero_transacciones"),
            "compras": (found or {}).get("compras"),
            "volumen_total": (found or {}).get("volumen_total"),
        }
        return {"status": "success", "data": data, "message": "Cliente sin lookup completo disponible."}


result_service = ResultService()
