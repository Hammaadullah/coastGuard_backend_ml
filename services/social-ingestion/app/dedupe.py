import redis
import time
from urllib.parse import urlparse
from app.config import Config

class DedupeStore:
    def __init__(self, redis_url=None):
        self.redis_url = redis_url or Config.REDIS_URL
        try:
            self.r = redis.from_url(self.redis_url)
            # test connection
            self.r.ping()
            self.backend = "redis"
        except Exception as e:
            print("Redis unavailable, falling back to file-based dedupe. Error:", e)
            self.r = None
            self.backend = "file"
            self.file_path = "/tmp/social_ingestion_seen_ids.txt"
            self._load_file_seen()

        self.ttl_seconds = Config.DEDUPE_TTL_DAYS * 24 * 3600

    def _load_file_seen(self):
        try:
            with open(self.file_path, "r") as f:
                self.seen = set(line.strip() for line in f if line.strip())
        except FileNotFoundError:
            self.seen = set()

    def _save_file_seen(self, key):
        with open(self.file_path, "a") as f:
            f.write(key + "\n")

    def is_new_and_mark(self, platform, post_id):
        key = f"dedupe:{platform}:{post_id}"
        if self.backend == "redis":
            # SET key with NX and TTL
            try:
                was_set = self.r.set(key, "1", nx=True, ex=self.ttl_seconds)
                return bool(was_set)
            except Exception as e:
                # fallback to file
                print("Redis failure during set; fallback to file. Error:", e)
                self.backend = "file"
                self._load_file_seen()

        # file fallback
        if key in self.seen:
            return False
        self.seen.add(key)
        self._save_file_seen(key)
        return True
