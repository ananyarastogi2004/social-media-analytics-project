from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from collections import Counter
import re

# 🔹 Clean words
def clean_words(text):
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    return words


def get_top_keywords(texts, n=3):
    words = []

    for t in texts:
        words.extend(clean_words(t))

    counter = Counter(words)
    common = counter.most_common(n)

    return [w[0] for w in common]


def cluster_posts(posts, k=3):
    texts = [p.text for p in posts if p.text]

    if len(texts) < k:
        return {"error": "Not enough data for clustering"}

    # 🔹 Vectorize
    vectorizer = TfidfVectorizer(stop_words='english')
    X = vectorizer.fit_transform(texts)

    # 🔹 KMeans
    model = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = model.fit_predict(X)

    clusters = {}

    # 🔹 Group texts
    for i, label in enumerate(labels):
        label = int(label)

        if label not in clusters:
            clusters[label] = []

        clusters[label].append(texts[i])

    # 🔥 NEW: Add labels based on keywords
    labeled_clusters = {}

    for label, texts in clusters.items():
        keywords = get_top_keywords(texts)

        cluster_name = f"Cluster {label + 1} ({', '.join(keywords)})"

        labeled_clusters[cluster_name] = texts

    return labeled_clusters