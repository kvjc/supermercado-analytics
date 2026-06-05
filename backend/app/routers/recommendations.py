from fastapi import APIRouter

from backend.app.services.result_service import result_service

router = APIRouter(prefix="/recommendations")


@router.get("/product/{product_id}")
def product_recommendations(product_id: str):
    return result_service.recommendation("product_recommendations.json", product_id)


@router.get("/client/{client_id}")
def client_recommendations(client_id: str):
    return result_service.recommendation("client_recommendations.json", client_id)

