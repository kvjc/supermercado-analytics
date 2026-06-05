from collections import Counter, defaultdict

import pandas as pd

from .config import RESULTS_DIR
from .utils import write_json


def generate_recommendations(transactions: pd.DataFrame, limit: int = 8) -> dict[str, object]:
    transaction_products = transactions.groupby("id_transaccion")["id_producto"].apply(lambda items: sorted(set(map(str, items))))
    cooccurrence: dict[str, Counter[str]] = defaultdict(Counter)

    for products in transaction_products:
        for product in products:
            for other in products:
                if product != other:
                    cooccurrence[product][other] += 1

    product_recommendations = {
        product: [
            {
                "product_id": other,
                "score": int(score),
                "reason": f"Co-ocurre con {product} en {score} transacciones.",
            }
            for other, score in counter.most_common(limit)
        ]
        for product, counter in cooccurrence.items()
    }

    client_recommendations = {}
    client_products = transactions.groupby("id_cliente")["id_producto"].apply(lambda items: sorted(set(map(str, items))))

    for client, products in client_products.items():
        scores: Counter[str] = Counter()
        for product in products:
            for recommendation in product_recommendations.get(product, []):
                recommended_product = recommendation["product_id"]
                if recommended_product not in products:
                    scores[recommended_product] += int(recommendation["score"])

        client_recommendations[str(client)] = [
            {
                "product_id": product,
                "score": int(score),
                "reason": "Producto relacionado por co-ocurrencia con compras previas del cliente.",
            }
            for product, score in scores.most_common(limit)
        ]

    write_json(RESULTS_DIR / "product_recommendations.json", product_recommendations)
    write_json(RESULTS_DIR / "client_recommendations.json", client_recommendations)

    return {
        "generated_files": ["product_recommendations.json", "client_recommendations.json"],
        "products_with_recommendations": len(product_recommendations),
        "clients_with_recommendations": len(client_recommendations),
    }

