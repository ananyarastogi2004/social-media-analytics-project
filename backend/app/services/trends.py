import re
from collections import Counter

# Small English stopwords list for keyword filtering
STOPWORDS = set("""
the and for that with this from they have will are was but not you your can
have has had its it's it's been what when where who which also about into
over under more than then them these those such then their there here a an
""".split())


# Extract hashtags from text (normalized to lower-case)
def extract_hashtags(text: str):
    if not text:
        return []
    # match # followed by letters/numbers/underscore/hyphen
    tags = re.findall(r"#([\w\-]+)", text, flags=re.UNICODE)
    return ["#" + t.lower() for t in tags]


def get_trending_hashtags(posts, top_n=10):
    all_hashtags = []
    words = []

    for p in posts:
        text = (p.text or "")
        if not isinstance(text, str):
            continue
        text_l = text.lower()

        # Extract hashtags
        tags = extract_hashtags(text_l)
        all_hashtags.extend(tags)

        # Extract candidate keywords: alphabetic words length >=4 (unicode aware)
        candidates = re.findall(r"\b[^\W\d_]{4,}\b", text_l, flags=re.UNICODE)
        # Filter out stopwords, short tokens, and obvious noise (urls, mentions)
        for w in candidates:
            if w.startswith("http") or w.startswith("@"):  # skip urls / mentions
                continue
            if w in STOPWORDS:
                continue
            words.append(w)

    # Filter out uninformative hashtags (purely numeric or too short)
    def useful_hashtag(h):
        # must contain a letter and be at least 3 chars long (including #)
        return bool(re.search('[a-z]', h)) and len(h) >= 3 and not re.fullmatch(r"#\d+", h)

    useful_tags = [h for h in all_hashtags if useful_hashtag(h)]

    # If useful hashtags exist → use them
    if useful_tags:
        counter = Counter(useful_tags)
        return [{"hashtag": k, "count": v} for k, v in counter.most_common(top_n)]

    # Otherwise use keywords
    counter = Counter(words)
    return [{"keyword": k, "count": v} for k, v in counter.most_common(top_n)]