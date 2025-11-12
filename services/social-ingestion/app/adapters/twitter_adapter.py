import requests
import time
from .base_adapter import BaseAdapter

class TwitterAdapter(BaseAdapter):
    platform = "twitter"

    def __init__(self, bearer_token):
        self.bearer_token = bearer_token
        self.base_url = "https://api.twitter.com/2"
        self.session = requests.Session()
        self.session.headers.update({"Authorization": f"Bearer {self.bearer_token}"})

    def _build_query(self, keywords, geo_filter=None):
        # build OR of keywords, add lang:en; filtering by geocode/place is limited in v2
        q = " OR ".join([f'"{k}"' if " " in k else k for k in keywords])
        q += " lang:en -is:retweet"
        return q

    def search_posts(self, keywords, geo_filter=None, since_id=None, limit=100):
        q = self._build_query(keywords, geo_filter)
        url = f"{self.base_url}/tweets/search/recent"
        params = {
            "query": q,
            "max_results": 100 if limit > 100 else limit,
            "tweet.fields": "id,text,created_at,author_id,geo",
            "expansions": "author_id,geo.place_id",
            "user.fields": "username,name,location",
        }
        if since_id:
            params["since_id"] = since_id

        resp = self.session.get(url, params=params, timeout=15)
        resp.raise_for_status()
        payload = resp.json()
        results = []
        users_by_id = {}
        if "includes" in payload and "users" in payload["includes"]:
            for u in payload["includes"]["users"]:
                users_by_id[u["id"]] = u

        for t in payload.get("data", []):
            user = users_by_id.get(t.get("author_id"), {})
            results.append({
                "id": t["id"],
                "text": t["text"],
                "created_at": t.get("created_at"),
                "user": {
                    "id": user.get("id"),
                    "name": user.get("name"),
                    "username": user.get("username"),
                    "location": user.get("location")
                },
                "platform": self.platform,
                "extra": {"raw": t}
            })
        return results
