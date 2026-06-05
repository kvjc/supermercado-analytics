from fastapi import APIRouter, Query

from backend.app.services.result_service import result_service

router = APIRouter(prefix="/lookup")


@router.get("/products")
def products_lookup(
    search: str | None = None,
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    has_category: bool | None = None,
):
    return result_service.products_lookup(search=search, limit=limit, offset=offset, has_category=has_category)


@router.get("/products/top")
def top_product_lookup():
    return result_service.read_result("top_products.json")


@router.get("/products/{product_id}")
def product_lookup_plural(product_id: str):
    return result_service.product_lookup(product_id)


@router.get("/product/{product_id}")
def product_lookup(product_id: str):
    return result_service.product_lookup(product_id)


@router.get("/categories")
def categories_lookup(
    search: str | None = None,
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
):
    return result_service.categories_lookup(search=search, limit=limit, offset=offset)


@router.get("/categories/{category_id}")
def category_lookup(category_id: str):
    return result_service.category_lookup(category_id)


@router.get("/clients")
def clients_lookup(
    search: str | None = None,
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
):
    return result_service.clients_lookup(search=search, limit=limit, offset=offset)


@router.get("/clients/top")
def top_client_lookup():
    return result_service.read_result("top_clients.json")


@router.get("/clients/{client_id}")
def client_lookup_plural(client_id: str):
    return result_service.client_lookup(client_id)


@router.get("/client/{client_id}")
def client_lookup(client_id: str):
    return result_service.client_lookup(client_id)
