from apify_client import ApifyClient
import os

def fetch_from_dataset(dataset_id: str):
    client = ApifyClient(os.getenv("APIFY_TOKEN"))

    dataset = client.dataset(dataset_id)
    items = list(dataset.iterate_items())

    results = []

    for item in items:
        # handle multiple possible fields for text
        text = item.get("full_text") or item.get("text") or item.get("tweet_text") or ""

        # Robust username extraction from multiple possible fields
        def _extract_username(d):
            if not d:
                return "unknown"
            # direct fields
            for k in ("username", "user_name", "screen_name", "author", "from_user", "userName"):
                if k in d and d[k]:
                    v = d[k]
                    # if the value itself is a dict, prefer inner known fields
                    if isinstance(v, dict):
                        for ik in ("screen_name", "userName", "username", "name"):
                            if ik in v and v[ik]:
                                return str(v[ik])
                        # fallback to id or url
                        if v.get("id"):
                            return str(v.get("id"))
                        continue
                    return str(v)
            # nested user object
            u = d.get("user") if isinstance(d, dict) else None
            if u:
                for k in ("screen_name", "userName", "username", "name"):
                    if k in u and u[k]:
                        return str(u[k])
                if u.get("id"):
                    return str(u.get("id"))
            return "unknown"

        username = _extract_username(item)

        # Robust numeric extraction for likes and retweets — try common keys
        def _num_from_keys(d, keys):
            for k in keys:
                if k in d and d[k] is not None:
                    try:
                        return int(d[k])
                    except Exception:
                        try:
                            return int(float(d[k]))
                        except Exception:
                            return 0
            return 0

        likes = _num_from_keys(item, ["favorite_count", "favorites_count", "like_count", "likes", "likeCount"])
        retweets = _num_from_keys(item, ["retweet_count", "retweets", "share_count", "shares"])

        results.append({
            "text": text,
            "username": username,
            "likes": likes,
            "retweets": retweets,
            "platform": item.get("platform", "Twitter")
        })

    return results