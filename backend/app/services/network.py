import networkx as nx

def build_graph(posts):
    G = nx.Graph()

    for p in posts:
        user = p.username

        if not user:
            continue

        # Add node
        G.add_node(user)

        # If tweet mentions someone → create edge
        words = p.text.split()

        for w in words:
            if w.startswith("@"):
                mentioned = w.replace("@", "")
                G.add_node(mentioned)
                G.add_edge(user, mentioned)

    return G


def get_influencers(G):
    if len(G.nodes) == 0:
        return []

    eigen = nx.eigenvector_centrality(G, max_iter=1000)

    top = sorted(eigen.items(), key=lambda x: x[1], reverse=True)[:5]

    return [
        {"user": user, "score": round(score, 4)}
        for user, score in top
    ]


def get_connectors(G):
    if len(G.nodes) == 0:
        return []

    between = nx.betweenness_centrality(G)

    top = sorted(between.items(), key=lambda x: x[1], reverse=True)[:5]

    return [
        {"user": user, "score": round(score, 4)}
        for user, score in top
    ]