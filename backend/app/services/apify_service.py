from apify_client import ApifyClient
import os

def fetch_from_dataset(dataset_id: str):
    client = ApifyClient(os.getenv("APIFY_TOKEN"))

    dataset = client.dataset(dataset_id)
    items = list(dataset.iterate_items())

    results = []

    for item in items:
        # ✅ FIXED: handle multiple possible fields
        text = item.get("full_text") or item.get("text") or ""

        username = "unknown"
        if "user" in item and item["user"]:
            username = item["user"].get("screen_name", "unknown")

        likes = item.get("favorite_count", 0)
        retweets = item.get("retweet_count", 0)

        results.append({
            "text": text,
            "username": username,
            "likes": likes,
            "retweets": retweets,
            "platform": "Twitter"
        })

    return results