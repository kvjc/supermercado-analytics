from dataclasses import dataclass, field
from pathlib import Path
from zipfile import ZipFile

import pandas as pd

from .config import RAW_DIR


@dataclass
class RawDataset:
    source_path: Path
    transactions: pd.DataFrame
    categories: pd.DataFrame | None = None
    product_categories: pd.DataFrame | None = None
    transaction_files: list[str] = field(default_factory=list)
    catalog_files: list[str] = field(default_factory=list)
    internal_file_count: int = 0
    sample_transaction_columns: list[str] = field(default_factory=list)


def _is_transaction_file(name: str) -> bool:
    normalized = name.replace("\\", "/")
    return (
        normalized.startswith("DataSet/Transactions/")
        and normalized.endswith("_Tran.csv")
        and "__MACOSX" not in normalized
    )


def _is_categories_file(name: str) -> bool:
    return name.replace("\\", "/").endswith("DataSet/Products/Categories.csv")


def _is_product_category_file(name: str) -> bool:
    return name.replace("\\", "/").endswith("DataSet/Products/ProductCategory.csv")


def _read_transaction_csv(archive: ZipFile, name: str) -> pd.DataFrame:
    with archive.open(name) as file:
        frame = pd.read_csv(file, sep="|", encoding="utf-8", header=None)

    if frame.shape[1] >= 4:
        frame = frame.iloc[:, :4]
        frame.columns = ["fecha", "sucursal", "id_cliente", "productos"]
    else:
        raise ValueError(f"Archivo de transacciones con columnas insuficientes: {name}")

    frame["source_file"] = name
    return frame


def _read_categories_csv(archive: ZipFile, name: str) -> pd.DataFrame:
    with archive.open(name) as file:
        frame = pd.read_csv(file, sep="|", encoding="utf-8", header=None)
    frame = frame.iloc[:, :2]
    frame.columns = ["categoria_id", "categoria_nombre"]
    return frame


def _read_product_category_csv(archive: ZipFile, name: str) -> pd.DataFrame:
    with archive.open(name) as file:
        frame = pd.read_csv(file, sep="|", encoding="utf-8")
    frame = frame.iloc[:, :2]
    frame.columns = ["id_producto", "categoria_id"]
    return frame


def load_dataset_from_zip(zip_path: Path) -> RawDataset:
    transaction_frames: list[pd.DataFrame] = []
    categories: pd.DataFrame | None = None
    product_categories: pd.DataFrame | None = None
    transaction_files: list[str] = []
    catalog_files: list[str] = []

    print(f"ZIP encontrado: {zip_path}")
    with ZipFile(zip_path) as archive:
        names = [name for name in archive.namelist() if not name.endswith("/") and "__MACOSX" not in name]
        print(f"Cantidad de archivos internos: {len(names)}")

        for name in names:
            if _is_transaction_file(name):
                transaction_files.append(name)
            elif _is_categories_file(name):
                catalog_files.append(name)
                categories = _read_categories_csv(archive, name)
            elif _is_product_category_file(name):
                catalog_files.append(name)
                product_categories = _read_product_category_csv(archive, name)

        print(f"Archivos de transacciones detectados: {len(transaction_files)}")
        for name in transaction_files:
            frame = _read_transaction_csv(archive, name)
            transaction_frames.append(frame)

    if not transaction_frames:
        raise FileNotFoundError("No se encontraron archivos DataSet/Transactions/*_Tran.csv dentro del ZIP.")

    transactions = pd.concat(transaction_frames, ignore_index=True)
    sample_columns = list(transaction_frames[0].columns)
    print(f"Archivos de catalogo detectados: {catalog_files}")
    print(f"Columnas reales normalizadas de transacciones: {sample_columns}")
    print(f"Filas de transacciones cargadas: {len(transactions)}")

    return RawDataset(
        source_path=zip_path,
        transactions=transactions,
        categories=categories,
        product_categories=product_categories,
        transaction_files=transaction_files,
        catalog_files=catalog_files,
        internal_file_count=len(names),
        sample_transaction_columns=sample_columns,
    )


def load_raw_dataset(raw_dir: Path = RAW_DIR) -> RawDataset | None:
    raw_dir.mkdir(parents=True, exist_ok=True)
    zip_files = sorted(path for path in raw_dir.iterdir() if path.suffix.lower() == ".zip" and not path.name.startswith("."))

    if zip_files:
        preferred = next((path for path in zip_files if path.name.lower() == "dataset.zip"), zip_files[0])
        return load_dataset_from_zip(preferred)

    return None
