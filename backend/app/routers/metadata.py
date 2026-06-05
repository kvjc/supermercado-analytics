from fastapi import APIRouter

from backend.app.services.result_service import result_service

router = APIRouter(prefix="/metadata")


@router.get("/last-update")
def last_update():
    return result_service.metadata()

