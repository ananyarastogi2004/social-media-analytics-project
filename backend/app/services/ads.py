def calculate_engagement(post):
    # Be defensive: handle None or non-int values
    likes = int(post.likes or 0)
    retweets = int(post.retweets or 0)

    # Primary signal: likes (higher weight). Secondary: retweets.
    # Return a composite score but prefer sorting by likes first elsewhere.
    return likes + (2 * retweets)


def top_posts(posts, top_n=5):
    scored = []

    for p in posts:
        likes = int(p.likes or 0)
        retweets = int(p.retweets or 0)
        score = calculate_engagement(p)

        scored.append({
            "text": p.text,
            "likes": likes,
            "retweets": retweets,
            "score": score
        })

    # Prefer posts with more likes, then more retweets, then composite score
    scored = sorted(scored, key=lambda x: (x["likes"], x["retweets"], x["score"]), reverse=True)

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