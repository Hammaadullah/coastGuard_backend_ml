from abc import ABC, abstractmethod

class BaseAdapter(ABC):
    platform: str

    def search_posts(self, keywords, geo_filter=None, since_id=None, limit=100):
        raise NotImplementedError
