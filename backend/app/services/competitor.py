from collections import Counter
from app.services.sentiment import analyze_sentiment
import re

def analyze_competitor(posts, keyword):
    keyword = keyword.lower()

    filtered = [p for p in posts if keyword in p.text.lower()]

    if not filtered:
        return {
            "keyword": keyword,
            "count": 0,
            "sentiment": {"Positive": 0, "Negative": 0, "Neutral": 0},
            "top_keywords": []
        }

    # 🔹 Sentiment
    sentiment_summary = {"Positive": 0, "Negative": 0, "Neutral": 0}

    words = []

    for p in filtered:
        sentiment = analyze_sentiment(p.text)
        sentiment_summary[sentiment] += 1

        STOPWORDS = {
            # common
            "the", "is", "in", "to", "and", "a", "of", "for", "on", "at",
            "with", "this", "that", "from", "are", "was", "but", "have",

            # pronouns (🔥 important fix)
            "you", "your", "yours", "they", "them", "their", "we", "our",
            "i", "me", "my", "he", "she", "it", "his", "her", "its",

            # misc noise
            "will", "just", "can", "get", "got", "like"
        }

        def clean_text(text, keyword=None):
            # remove links
            text = re.sub(r"http\S+", "", text)

            # remove mentions
            text = re.sub(r"@\w+", "", text)

            # extract words
            words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())

            clean = []

            for w in words:
                if w in STOPWORDS:
                    continue

                if keyword and w == keyword.lower():
                    continue

                clean.append(w)

            return clean
        
        words.extend(clean_text(p.text,keyword))

    # 🔹 Top keywords
    counter = Counter(words)
    top_words = counter.most_common(5)

    return {
        "keyword": keyword,
        "count": len(filtered),
        "sentiment": sentiment_summary,
        "top_keywords": top_words
    }


def compare_competitors(posts, keywords):
    results = []

    for kw in keywords:
        results.append(analyze_competitor(posts, kw))

    return results