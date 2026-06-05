import json
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


def ensure_directories(*directories: Path) -> None:
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)


def normalize_column_name(value: str) -> str:
    normalized = unicodedata.normalize("NFD", str(value).strip().lower())
    normalized = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return "".join(char if char.isalnum() else "_" for char in normalized).strip("_")


def _json_default(value: Any) -> Any:
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return float(value)
    if isinstance(value, (np.ndarray,)):
        return value.tolist()
    if pd.isna(value):
        return None
    return str(value)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, default=_json_default), encoding="utf-8")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def records(df: pd.DataFrame) -> list[dict[str, Any]]:
    clean = df.replace({pd.NA: None})
    clean = clean.where(pd.notnull(clean), None)
    return clean.to_dict(orient="records")


def safe_number(value: Any) -> float:
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return 0.0
    return numeric if pd.notna(numeric) else 0.0
