from fastapi import APIRouter

from backend.app.services.result_service import result_service

router = APIRouter(prefix="/segmentation")


@router.get("/customers")
def customers():
    return result_service.read_result("customer_segments.json")


@router.get("/profiles")
def profiles():
    return result_service.read_result("segment_profiles.json")

