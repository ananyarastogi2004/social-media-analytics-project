import networkx as nx
from collections import defaultdict

# 🔹 Build graph (reuse logic)
def build_graph(posts):
    G = nx.Graph()

    def infer_author(p):
        # prefer explicit username field
        raw = getattr(p, 'username', None)
        if raw and raw != 'unknown':
            # sanitize stored username values — they may be dicts or stringified dicts
            try:
                # if it's already a dict-like object
                if isinstance(raw, dict):
                    for k in ('screen_name', 'userName', 'username', 'name'):
                        if raw.get(k):
                            return str(raw.get(k))
                # if it's a string that looks like a dict, try to parse
                if isinstance(raw, str) and raw.strip().startswith('{'):
                    import ast
                    try:
                        obj = ast.literal_eval(raw)
                        if isinstance(obj, dict):
                            for k in ('userName', 'screen_name', 'username', 'name'):
                                if k in obj and obj[k]:
                                    return str(obj[k])
                    except Exception:
                        pass
                # otherwise return the raw string (could be a handle)
                return str(raw)
            except Exception:
                return str(raw)

        text = (p.text or "")
        if not isinstance(text, str):
            return f"user_{hash(str(p))%1000}"

        # common patterns: RT @user:, starts with @user, 'via @user', 'by @user', '- @user' at end
        m = None
        import re
        # RT @user: pattern
        m = re.search(r"RT\s+@([A-Za-z0-9_]+)", text)
        if m:
            return m.group(1)
        # starts with @user
        m = re.match(r"^@([A-Za-z0-9_]+)", text)
        if m:
            return m.group(1)
        # via @user or by @user
        m = re.search(r"(?:via|by)\s+@([A-Za-z0-9_]+)", text)
        if m:
            return m.group(1)
        # trailing - @user or — @user
        m = re.search(r"[-—]\s*@([A-Za-z0-9_]+)\s*$", text)
        if m:
            return m.group(1)

        # fallback hashed placeholder
        return f"user_{hash(text)%1000}"

    for p in posts:
        user = infer_author(p)

        G.add_node(user)

        words = (p.text or "").split()

        for w in words:
            if w.startswith("@"):
                mentioned = w.lstrip("@")
                G.add_node(mentioned)
                G.add_edge(user, mentioned)

    return G


def calculate_influencers(posts):
    if not posts:
        return []

    # 🔹 Build graph
    G = build_graph(posts)

    # 🔹 Centrality
    centrality = nx.degree_centrality(G)

    # 🔹 Engagement per user
    engagement = defaultdict(int)
    activity = defaultdict(int)

    for p in posts:
        user = p.username if p.username != "unknown" else f"user_{hash(p.text)%1000}"

        score = p.likes + (2 * p.retweets)

        engagement[user] += score
        activity[user] += 1

    # 🔹 Normalize values
    max_eng = max(engagement.values()) if engagement else 1
    max_act = max(activity.values()) if activity else 1

    results = []

    for user in G.nodes:
        eng_score = engagement[user] / max_eng if max_eng else 0
        act_score = activity[user] / max_act if max_act else 0
        cent_score = centrality.get(user, 0)

        final_score = (
            0.5 * eng_score +
            0.3 * cent_score +
            0.2 * act_score
        )

        results.append({
            "user": user,
            "score": round(final_score, 3),
            "engagement": round(eng_score, 3),
            "centrality": round(cent_score, 3),
            "activity": round(act_score, 3)
        })

    # 🔹 Sort
    results = sorted(results, key=lambda x: x["score"], reverse=True)

    return results[:10]