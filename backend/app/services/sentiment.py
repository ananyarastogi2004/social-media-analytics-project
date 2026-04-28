from textblob import TextBlob

def analyze_sentiment(text: str):
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity

    if polarity > 0:
        return "Positive"
    elif polarity < 0:
        return "Negative"
    else:
        return "Neutral"


def analyze_posts(posts):
    results = []

    for p in posts:
        sentiment = analyze_sentiment(p.text)

        results.append({
            "text": p.text,
            "sentiment": sentiment
        })

    return results