from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.post import Post
from app.services.sentiment import analyze_posts
from app.services.trends import get_trending_hashtags
from app.services.network import build_graph, get_influencers, get_connectors
from app.services.recommendation import recommend_posts
from app.services.fake_news import analyze_posts as fake_news_analysis
from app.services.segmentation import cluster_posts
from app.services.visualization import sentiment_chart, trends_chart, activity_chart
from app.services.ads import top_posts, generate_suggestions
from app.services.influencer import calculate_influencers
from app.services.competitor import compare_competitors
from app.services.prediction import predict_trend
from app.services.deps import get_current_user

router = APIRouter()

@router.get("/sentiment")
def sentiment_analysis(
    user=Depends(get_current_user),   # 🔥 added
    db: Session = Depends(get_db)):
    posts = db.query(Post).all()

    results = analyze_posts(posts)

    # Count summary
    summary = {"Positive": 0, "Negative": 0, "Neutral": 0}

    for r in results:
        summary[r["sentiment"]] += 1

    return {
        "summary": summary,
        "data": results
    }

@router.get("/trends")
def trending_topics(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)):
    posts = db.query(Post).all()

    trends = get_trending_hashtags(posts)

    return {
        "total_posts": len(posts),
        "trending_hashtags": trends
    }

@router.get("/network")
def network_analysis(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)):
    posts = db.query(Post).all()

    G = build_graph(posts)

    influencers = get_influencers(G)
    connectors = get_connectors(G)

    return {
        "total_nodes": len(G.nodes),
        "total_edges": len(G.edges),
        "top_influencers": influencers,
        "key_connectors": connectors
    }

@router.get("/recommend")
def get_recommendations(
    user=Depends(get_current_user),
    index: int = 0,
    db: Session = Depends(get_db)
):
    posts = db.query(Post).all()

    # 🔥 CLEAN DATA
    clean_posts = [p for p in posts if p.text and len(p.text.strip()) > 20]

    if not clean_posts:
        return {"message": "No valid posts available"}

    if index >= len(clean_posts):
        return {"error": "Invalid index"}

    recommendations = recommend_posts(clean_posts, query_index=index)

    return {
        "selected_post": clean_posts[index].text,
        "recommendations": recommendations
    }

@router.delete("/clean")
def clean_database(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    posts = db.query(Post).all()

    deleted = 0

    for p in posts:
        if not p.text or len(p.text.strip()) < 20:
            db.delete(p)
            deleted += 1

    db.commit()

    return {"deleted": deleted}

@router.get("/fake-news")
def detect_fake_news(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    posts = db.query(Post).all()

    results = fake_news_analysis(posts)

    summary = {
        "Suspicious": 0,
        "Likely Real": 0
    }

    for r in results:
        summary[r["prediction"]] += 1

    return {
        "summary": summary,
        "data": results
    }

@router.get("/segments")
def get_segments(
    user=Depends(get_current_user),
    k: int = 3,
    db: Session = Depends(get_db)
):
    posts = db.query(Post).all()

    result = cluster_posts(posts, k)

    return result

@router.get("/charts/sentiment")
def sentiment_chart_api(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    posts = db.query(Post).all()

    results = analyze_posts(posts)

    summary = {"Positive": 0, "Negative": 0, "Neutral": 0}

    for r in results:
        summary[r["sentiment"]] += 1

    return sentiment_chart(summary)

@router.get("/charts/trends")
def trends_chart_api(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    posts = db.query(Post).all()

    trends = get_trending_hashtags(posts)

    return trends_chart(trends)

@router.get("/charts/activity")
def activity_chart_api(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    posts = db.query(Post).all()

    return activity_chart(posts)

@router.get("/engagement")
def engagement_analysis(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    posts = db.query(Post).all()

    if not posts:
        return {"message": "No data available"}

    top = top_posts(posts)
    suggestions = generate_suggestions(posts)

    return {
        "top_posts": top,
        "suggestions": suggestions
    }

@router.get("/influencers")
def influencer_analysis(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    posts = db.query(Post).all()

    influencers = calculate_influencers(posts)

    return {
        "top_influencers": influencers
    }

@router.get("/competitors")
def competitor_analysis(
    keywords: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    posts = db.query(Post).all()

    # Example input: "tesla,ford,byd"
    keyword_list = [k.strip() for k in keywords.split(",")]

    results = compare_competitors(posts, keyword_list)

    return {
        "comparison": results
    }

@router.get("/predict")
def trend_prediction(
    keyword: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    posts = db.query(Post).all()

    result = predict_trend(posts, keyword)

    return result

@router.get("/debug-posts")
def debug_posts(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    posts = db.query(Post).all()
    return {
        "count": len(posts),
        "sample": [p.text for p in posts[:3]]
    }