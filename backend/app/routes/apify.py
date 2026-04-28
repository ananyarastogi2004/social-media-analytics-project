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
        text = t["text"].strip()

        # ❌ skip empty
        if not text:
            skipped += 1
            continue

        # ❌ skip very short
        if len(text) < 10:
            skipped += 1
            continue

        # ❌ skip duplicates
        if text in existing_texts:
            skipped += 1
            continue

        post = Post(
            text=text,
            username=t["username"],
            likes=t["likes"],
            retweets=t["retweets"],
            platform=case.platform
        )

        db.add(post)
        existing_texts.add(text)
        saved += 1

    db.commit()

    return {
        "case": case.name,
        "saved": saved,
        "skipped": skipped
    }