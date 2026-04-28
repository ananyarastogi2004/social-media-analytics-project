from collections import Counter
import numpy as np
from sklearn.linear_model import LinearRegression

def extract_keyword_counts(posts, keyword):
    keyword = keyword.lower()

    # Simulate time buckets
    counts = []

    for i, p in enumerate(posts):
        if keyword in p.text.lower():
            counts.append(i)

    if not counts:
        return [], []

    # Group into time steps
    time_steps = list(range(len(counts)))
    values = [1] * len(counts)

    return time_steps, values


def predict_trend(posts, keyword):
    X, y = extract_keyword_counts(posts, keyword)

    if len(X) < 2:
        return {"error": "Not enough data to predict"}

    # Convert to numpy
    X = np.array(X).reshape(-1, 1)
    y = np.array(y)

    # Train model
    model = LinearRegression()
    model.fit(X, y)

    # Predict future (next 5 steps)
    future_X = np.array(range(len(X), len(X) + 5)).reshape(-1, 1)
    predictions = model.predict(future_X)

    return {
        "keyword": keyword,
        "history": y.tolist(),
        "predictions": [round(float(p), 2) for p in predictions]
    }