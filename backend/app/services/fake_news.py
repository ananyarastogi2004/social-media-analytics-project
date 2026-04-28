from transformers import pipeline

# Load model once
classifier = pipeline("sentiment-analysis")

def analyze_posts(posts):
    results = []

    texts = [p.text for p in posts if p.text]

    predictions = classifier(texts)

    for text, pred in zip(texts, predictions):
        label = pred["label"]

        # Map sentiment → fake/real (approx logic)
        if label == "NEGATIVE":
            tag = "Suspicious"
        else:
            tag = "Likely Real"

        results.append({
            "text": text,
            "prediction": tag,
            "confidence": round(pred["score"], 3)
        })

    return results