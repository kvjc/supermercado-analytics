import pandas as pd

from .config import DEFAULT_K, RESULTS_DIR
from .utils import records, write_json

SEGMENT_COLUMNS = [
    "frecuencia",
    "productos_distintos",
    "volumen_total",
    "categorias_distintas",
    "cantidad_promedio",
]


def _interpret(row: pd.Series, global_means: pd.Series) -> str:
    if row["frecuencia"] >= global_means["frecuencia"] and row["volumen_total"] >= global_means["volumen_total"]:
        return "clientes frecuentes de alto volumen"
    if row["volumen_total"] >= global_means["volumen_total"]:
        return "clientes de alto volumen"
    if row["productos_distintos"] >= global_means["productos_distintos"] and row["categorias_distintas"] >= global_means["categorias_distintas"]:
        return "clientes diversos"
    return "clientes ocasionales"


def _write_client_lookup(segmented: pd.DataFrame, profiles: pd.DataFrame) -> None:
    interpretation_map = profiles.set_index("segmento")["interpretacion"].to_dict() if not profiles.empty else {}
    lookup = segmented.copy()
    lookup["cliente_label"] = lookup["id_cliente"].map(lambda value: f"Cliente {value}")
    lookup["transacciones"] = lookup["frecuencia"]
    lookup["interpretacion_segmento"] = lookup["segmento"].map(interpretation_map)
    lookup = lookup[
        [
            "id_cliente",
            "cliente_label",
            "transacciones",
            "volumen_total",
            "productos_distintos",
            "categorias_distintas",
            "cantidad_promedio",
            "segmento",
            "interpretacion_segmento",
        ]
    ].sort_values(["transacciones", "volumen_total"], ascending=False)
    write_json(RESULTS_DIR / "client_lookup.json", records(lookup))


def run_segmentation(features: pd.DataFrame, k: int = DEFAULT_K) -> dict[str, object]:
    if features.empty or len(features) < 2:
        write_json(RESULTS_DIR / "customer_segments.json", [])
        write_json(RESULTS_DIR / "segment_profiles.json", [])
        write_json(RESULTS_DIR / "client_lookup.json", [])
        return {"generated_files": ["customer_segments.json", "segment_profiles.json", "client_lookup.json"], "segments": 0}

    try:
        from sklearn.cluster import KMeans
        from sklearn.preprocessing import StandardScaler
    except Exception as exc:
        print(f"scikit-learn no disponible, se omite segmentacion: {exc}")
        write_json(RESULTS_DIR / "customer_segments.json", [])
        write_json(RESULTS_DIR / "segment_profiles.json", [])
        write_json(RESULTS_DIR / "client_lookup.json", [])
        return {"generated_files": ["customer_segments.json", "segment_profiles.json", "client_lookup.json"], "segments": 0}

    variables = features[SEGMENT_COLUMNS].fillna(0)
    segment_count = max(1, min(k, len(features)))
    scaled = StandardScaler().fit_transform(variables)
    labels = KMeans(n_clusters=segment_count, random_state=42, n_init=10).fit_predict(scaled)

    segmented = features.copy()
    segmented["segmento"] = labels.astype(int)

    profiles = segmented.groupby("segmento")[SEGMENT_COLUMNS].mean().round(3).reset_index()
    counts = segmented.groupby("segmento").size().rename("clientes").reset_index()
    profiles = profiles.merge(counts, on="segmento")

    global_means = features[SEGMENT_COLUMNS].mean()
    profiles["interpretacion"] = profiles.apply(lambda row: _interpret(row, global_means), axis=1)

    write_json(RESULTS_DIR / "customer_segments.json", records(segmented))
    write_json(RESULTS_DIR / "segment_profiles.json", records(profiles))
    _write_client_lookup(segmented, profiles)

    return {"generated_files": ["customer_segments.json", "segment_profiles.json", "client_lookup.json"], "segments": int(segment_count)}
