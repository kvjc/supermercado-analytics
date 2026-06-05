from typing import Any

from pydantic import BaseModel


class ApiResponse(BaseModel):
    status: str
    data: Any = None
    message: str | None = None

