from fastapi import APIRouter

from backend.app.services.result_service import result_service

router = APIRouter()


@router.get("/summary")
def summary():
    return result_service.read_result("summary.json", default={})


@router.get("/top-products")
def top_products():
    return result_service.read_result("top_products.json")


@router.get("/top-clients")
def top_clients():
    return result_service.read_result("top_clients.json")


@router.get("/peak-days")
def peak_days():
    return result_service.read_result("peak_days.json")

