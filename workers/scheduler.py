import time
from apify_worker import run_worker

# 🔹 Interval (seconds)
INTERVAL = 300  # 5 minutes


def start_scheduler():
    print("⏱️ Scheduler started...")

    while True:
        run_worker()
        print(f"⏳ Sleeping for {INTERVAL} seconds...\n")
        time.sleep(INTERVAL)


if __name__ == "__main__":
    start_scheduler()