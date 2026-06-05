from pathlib import Path

import pandas as pd

from .config import CANONICAL_COLUMNS, QUARANTINE_DIR
from .utils import now_iso, write_json


def validate_canonical_frame(
    df: pd.DataFrame,
    source_name: str,
    quarantine_dir: Path = QUARANTINE_DIR,
) -> tuple[bool, dict[str, object]]:
    missing = [column for column in CANONICAL_COLUMNS if column not in df.columns]
    null_counts = {column: int(df[column].isna().sum()) for column in CANONICAL_COLUMNS if column in df.columns}
    report = {
        "source": source_name,
        "checked_at": now_iso(),
        "rows": int(len(df)),
        "columns_detected": list(map(str, df.columns)),
        "missing_columns": missing,
        "null_counts": null_counts,
    }

    if missing:
        write_json(quarantine_dir / f"{Path(source_name).stem}_canonical_validation_error.json", report)
        return False, report

    return True, report
