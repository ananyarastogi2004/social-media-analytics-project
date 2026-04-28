import networkx as nx
from collections import defaultdict

# 🔹 Build graph (reuse logic)
def build_graph(posts):
    G = nx.Graph()

    for p in posts:
        user = p.username if p.username != "unknown" else f"user_{hash(p.text)%1000}"

        G.add_node(user)

        words = p.text.split()

        for w in words:
            if w.startswith("@"):
                mentioned = w.replace("@", "")
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