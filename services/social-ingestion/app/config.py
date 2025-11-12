import os
from dotenv import load_dotenv
load_dotenv()

class Config:
    RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
    RABBITMQ_QUEUE = os.getenv("RABBITMQ_QUEUE", "social_posts")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    SCHEDULER_INTERVAL_MINUTES = int(os.getenv("SCHEDULER_INTERVAL_MINUTES", "30"))
    DEDUPE_TTL_DAYS = int(os.getenv("DEDUPE_TTL_DAYS", "30"))

    # Keyword list
    HAZARD_KEYWORDS = [
        "tsunami", "high wave", "high-wave", "storm surge", "surge", "coastal flooding",
        "high tide", "rogue wave", "stormwave", "coastal erosion"
    ]
    GEO_FILTER = "India"  # used by adapters that support place/location search
