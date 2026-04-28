def calculate_engagement(post):
    return post.likes + (2 * post.retweets)


def top_posts(posts, top_n=5):
    scored = []

    for p in posts:
        score = calculate_engagement(p)

        scored.append({
            "text": p.text,
            "likes": p.likes,
            "retweets": p.retweets,
            "score": score
        })

    # Sort by score
    scored = sorted(scored, key=lambda x: x["score"], reverse=True)

    return scored[:top_n]


def generate_suggestions(posts):
    suggestions = []

    avg_length = sum(len(p.text) for p in posts) / len(posts) if posts else 0

    if avg_length < 50:
        suggestions.append("Use longer, more descriptive posts")

    if any("http" in p.text for p in posts):
        suggestions.append("Posts with links perform well")

    if any("#" in p.text for p in posts):
        suggestions.append("Using hashtags improves reach")

    if not suggestions:
        suggestions.append("Content strategy looks balanced")

    return suggestions