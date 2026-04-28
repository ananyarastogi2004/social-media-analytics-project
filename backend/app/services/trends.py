import re
from collections import Counter

# Extract hashtags from text
def extract_hashtags(text: str):
    return re.findall(r"#\w+", text.lower())


def get_trending_hashtags(posts, top_n=10):
    all_hashtags = []
    words = []

    for p in posts:
        text = p.text.lower()

        # Extract hashtags
        tags = re.findall(r"#\w+", text)
        all_hashtags.extend(tags)

        # Extract keywords (fallback)
        words.extend(re.findall(r"\b[a-z]{4,}\b", text))

    # If hashtags exist → use them
    if all_hashtags:
        counter = Counter(all_hashtags)
        return [{"hashtag": k, "count": v} for k, v in counter.most_common(top_n)]

    # Otherwise use keywords
    counter = Counter(words)
    return [{"keyword": k, "count": v} for k, v in counter.most_common(top_n)]