from fastapi import APIRouter

from backend.app.services.result_service import result_service

router = APIRouter()


@router.get("/time-series/daily")
def daily_series():
    return result_service.read_result("daily_series.json")


@router.get("/time-series/weekly")
def weekly_series():
    return result_service.read_result("weekly_series.json")


@router.get("/categories")
def categories():
    return result_service.read_result("categories.json")


@router.get("/correlations")
def correlations():
    return result_service.read_result("correlation_matrix.json")


@router.get("/weekday/transactions")
def weekday_transactions():
    return result_service.read_result("weekday_transactions.json")


@router.get("/weekday/units")
def weekday_units():
    return result_service.read_result("weekday_units.json")
