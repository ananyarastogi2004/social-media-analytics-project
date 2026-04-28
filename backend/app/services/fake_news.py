from transformers import pipeline

# Load model once
classifier = pipeline("sentiment-analysis")


def analyze_posts(posts):
    results = []

    texts = [p.text for p in posts if p.text]
    if not texts:
        return results

    # Try batch inference with truncation; fall back to per-text processing
    try:
        predictions = classifier(texts, truncation=True, max_length=512)
    except Exception:
        predictions = []
        for t in texts:
            try:
                pred = classifier(t, truncation=True, max_length=512)
                # classifier may return a single dict or a list
                if isinstance(pred, list):
                    predictions.extend(pred)
                else:
                    predictions.append(pred)
            except Exception:
                predictions.append({"label": "UNKNOWN", "score": 0.0})

    for text, pred in zip(texts, predictions):
        label = pred.get("label", "UNKNOWN")

        # Map sentiment → fake/real (approx logic)
        if label == "NEGATIVE":
            tag = "Suspicious"
        elif label == "UNKNOWN":
            tag = "Unknown"
        else:
            tag = "Likely Real"

        results.append({
            "text": text,
            "prediction": tag,
            "confidence": round(pred.get("score", 0.0), 3)
        })

    return results