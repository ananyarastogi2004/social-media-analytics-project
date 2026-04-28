from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.apify_service import fetch_from_dataset
from app.models.post import Post
from app.models.case import Case

router = APIRouter()

@router.post("/fetch-by-case")
def fetch_by_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()

    if not case:
        return {"error": "Case not found"}

    tweets = fetch_from_dataset(case.dataset_id)

    saved = 0
    skipped = 0

    existing_texts = set([p.text for p in db.query(Post).all()])

    for t in tweets:
        text = (t.get("text") or "").strip()

        # skip empty or very short
        if not text or len(text) < 10:
            skipped += 1
            continue

        # If duplicate — update counts on existing post instead of skipping
        if text in existing_texts:
            existing = db.query(Post).filter(Post.text == text).first()
            if existing:
                try:
                    existing.likes = int(t.get("likes", existing.likes or 0) or 0)
                except Exception:
                    existing.likes = existing.likes or 0
                try:
                    existing.retweets = int(t.get("retweets", existing.retweets or 0) or 0)
                except Exception:
                    existing.retweets = existing.retweets or 0
                # update username if we have a better value
                new_un = t.get("username")
                if new_un and (not existing.username or existing.username == "unknown"):
                    existing.username = new_un
                # no increment to saved; treat as update
            skipped += 1
            continue

        # create new post
        post = Post(
            text=text,
            username=t.get("username", "unknown"),
            likes=int(t.get("likes", 0) or 0),
            retweets=int(t.get("retweets", 0) or 0),
            platform=case.platform
        )

        db.add(post)
        existing_texts.add(text)
        saved += 1

    db.commit()

    # Sanitize any stored usernames that are stringified dicts (e.g. "{'userName': 'elonmusk', ...}")
    try:
        import ast
        dirty = db.query(Post).filter(Post.username.like("{%")).all()
        for p in dirty:
            raw = p.username
            try:
                obj = ast.literal_eval(raw)
                if isinstance(obj, dict):
                    for k in ("userName", "screen_name", "username", "name"):
                        if k in obj and obj[k]:
                            p.username = str(obj[k])
                            break
            except Exception:
                # leave as-is if parsing fails
                continue
        db.commit()
    except Exception:
        pass

    return {
        "case": case.name,
        "saved": saved,
        "skipped": skipped
    }