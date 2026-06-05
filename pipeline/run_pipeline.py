from .config import PROCESSED_DIR, QUARANTINE_DIR, RAW_DIR, RESULTS_DIR
from .descriptive import generate_descriptive_results
from .ingest import load_raw_dataset
from .recommender import generate_recommendations
from .segmentation import run_segmentation
from .transform import build_transaction_lines, save_processed
from .utils import ensure_directories, now_iso, write_json
from .validate import validate_canonical_frame


def run_pipeline() -> dict[str, object]:
    ensure_directories(RAW_DIR, PROCESSED_DIR, RESULTS_DIR, QUARANTINE_DIR)
    generated_files: list[str] = []

    raw_dataset = load_raw_dataset(RAW_DIR)
    if raw_dataset is None:
        metadata = {
            "status": "no_input",
            "last_update": now_iso(),
            "message": "No hay ZIP en data/raw. Agregue DataSet.zip y ejecute python -m pipeline.run_pipeline.",
            "processed_files": [],
            "records_processed": 0,
            "generated_files": [],
        }
        write_json(RESULTS_DIR / "metadata.json", metadata)
        print(metadata["message"])
        return metadata

    transactions, invalid_rows, category_coverage = build_transaction_lines(
        raw_dataset.transactions,
        raw_dataset.product_categories,
        raw_dataset.categories,
    )
    print(f"Filas generadas en transaction_lines: {len(transactions)}")
    print(f"Registros invalidos separados: {len(invalid_rows)}")
    print(f"Total units: {transactions['cantidad'].sum()}")
    print(f"Transacciones únicas: {transactions['id_transaccion'].nunique()}")
    print(f"Cobertura de categorías: {category_coverage['porcentaje_con_categoria']:.2f}% con categoría, {category_coverage['porcentaje_sin_categoria']:.2f}% sin categoría")

    is_valid, validation_report = validate_canonical_frame(transactions, raw_dataset.source_path.name)
    if not is_valid:
        metadata = {
            "status": "validation_failed",
            "last_update": now_iso(),
            "message": "El DataFrame canonico no cumple las columnas requeridas. Revise data/quarantine.",
            "processed_files": [raw_dataset.source_path.name],
            "records_processed": 0,
            "generated_files": [],
            "validation_report": validation_report,
        }
        write_json(RESULTS_DIR / "metadata.json", metadata)
        print(metadata["message"])
        return metadata

    generated_files.extend(save_processed(transactions))
    descriptive = generate_descriptive_results(transactions, category_coverage)
    generated_files.extend(descriptive["generated_files"])
    segmentation = run_segmentation(descriptive["customer_features"])
    generated_files.extend(segmentation["generated_files"])
    recommender = generate_recommendations(transactions)
    generated_files.extend(recommender["generated_files"])

    metadata = {
        "status": "success",
        "last_update": now_iso(),
        "processed_files": [raw_dataset.source_path.name],
        "transaction_files": raw_dataset.transaction_files,
        "catalog_files": raw_dataset.catalog_files,
        "records_processed": int(len(transactions)),
        "invalid_records": int(len(invalid_rows)),
        "category_match_percentage": category_coverage["porcentaje_con_categoria"],
        "category_coverage": category_coverage,
        "generated_files": generated_files,
        "validation_report": validation_report,
        "summary": descriptive["summary"],
        "segmentation": segmentation,
        "recommendations": recommender,
    }
    write_json(RESULTS_DIR / "metadata.json", metadata)

    print("Pipeline SAT completado.")
    print(f"Registros procesados: {metadata['records_processed']}")
    print("Archivos generados en data/results:")
    for file in generated_files:
        print(f"- {file}")
    print("Top 10 categorías generado:")
    for item in descriptive.get("top_categories", []):
        print(f"- {item['categoria']}: {item['cantidad']}")
    return metadata


if __name__ == "__main__":
    run_pipeline()
