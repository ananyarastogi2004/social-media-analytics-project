from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def recommend_posts(posts, query_index=0, top_n=5):
    if not posts:
        return []

    texts = [p.text for p in posts]

    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(texts)

    similarity = cosine_similarity(tfidf_matrix)

    scores = list(enumerate(similarity[query_index]))
    scores = sorted(scores, key=lambda x: x[1], reverse=True)

    recommendations = []
    seen_texts = set()

    query_text = texts[query_index]

    for idx, score in scores:
        # ❌ skip itself
        if idx == query_index:
            continue

        # ❌ skip exact duplicates
        if texts[idx] == query_text:
            continue

        # ❌ skip already added
        if texts[idx] in seen_texts:
            continue

        recommendations.append({
            "text": texts[idx],
            "similarity": round(float(score), 3)
        })

        seen_texts.add(texts[idx])

        if len(recommendations) >= top_n:
            break

    return recommendations