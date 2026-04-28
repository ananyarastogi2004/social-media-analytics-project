from collections import Counter
from datetime import datetime

# 📊 Sentiment → Pie Chart
def sentiment_chart(summary):
    return {
        "labels": list(summary.keys()),
        "values": list(summary.values())
    }


# 📊 Trends → Bar Chart
def trends_chart(trends):
    labels = []
    values = []

    for item in trends:
        key = item.get("hashtag") or item.get("keyword")
        labels.append(key)
        values.append(item["count"])

    return {
        "labels": labels,
        "values": values
    }


# 📊 Activity over time → Line Chart (simple version)
def activity_chart(posts):
    dates = []

    for p in posts:
        # since we don’t store timestamps yet → simulate
        dates.append(datetime.now().strftime("%H:%M"))

    counter = Counter(dates)

    return {
        "labels": list(counter.keys()),
        "values": list(counter.values())
    }