import sys
import os

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.apify_service import fetch_from_dataset
from app.database import SessionLocal
from app.models.post import Post
from app.models.case import Case


def run_worker():
    print("🚀 Running Apify worker...")

    db = SessionLocal()

    cases = db.query(Case).all()

    if not cases:
        print("⚠️ No cases found. Add a case first.")
        return

    total_saved = 0

    # 🔹 fetch existing posts once (optimization)
    existing_texts = set([p.text for p in db.query(Post).all()])

    for case in cases:
        print(f"📊 Processing case: {case.name}")

        tweets = fetch_from_dataset(case.dataset_id)

        saved = 0

        for t in tweets:
            text = t["text"].strip()

            # ❌ skip bad data
            if not text or len(text) < 10:
                continue

            # ❌ skip duplicates
            if text in existing_texts:
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

        print(f"✅ {case.name}: {saved} new posts")
        total_saved += saved

    db.commit()
    db.close()

    print(f"🎯 Worker finished. Total saved: {total_saved}")