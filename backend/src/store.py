from __future__ import annotations

import threading
from pathlib import Path
from typing import List, Optional

# Directory where JSON DB will be stored. Using a relative path keeps it portable.
DATA_PATH = Path("data")

from tinydb import TinyDB, Query
from tinydb.storages import JSONStorage
from tinydb_serialization import SerializationMiddleware
from tinydb_serialization.serializers import DateTimeSerializer

import time  # NEW: for simulated processing delay

from .models import Polygon, PolygonCreate, PolygonUpdate


class PolygonStore:
    """Encapsulates persistence logic for `Polygon` objects using TinyDB.

    Args:
        db_path: Path to the JSON file on disk that will hold the data.
    """

    def __init__(self, db_path: str | Path = DATA_PATH / "polygons_db.json") -> None:
        # Ensure directory exists and is writable
        self._db_path = Path(db_path)
        self._db_path.parent.mkdir(parents=True, exist_ok=True)

        # Use serialization middleware for potential future extensions (e.g., datetime)
        serialization = SerializationMiddleware(JSONStorage)
        serialization.register_serializer(DateTimeSerializer(), "TinyDate")

        self._db = TinyDB(self._db_path, storage=serialization)
        # Use a reentrant lock (RLock) to allow nested acquisition within the same thread
        self._lock = threading.RLock()

    # ----------------------------- Helper methods -----------------------------

    def _get_next_id(self) -> int:
        """Compute the next available polygon ID (auto-increment)."""
        polygons = self._db.all()
        if not polygons:
            return 1
        return max(p["id"] for p in polygons) + 1

    def _get_polygon_index(self, polygon_id: int) -> Optional[int]:
        """Return the index of the polygon in the DB list, or None if not found."""
        for idx, poly in enumerate(self._db):
            if poly["id"] == polygon_id:
                return idx
        return None

    # ----------------------------- Public CRUD API -----------------------------

    def create_polygon(self, polygon_in: PolygonCreate) -> Polygon:
        """Create and persist a new polygon."""
        with self._lock:
            time.sleep(5)  # Simulate processing time and serialize concurrent requests
            polygon_data = polygon_in.model_dump()
            polygon_data["id"] = self._get_next_id()
            self._db.insert(polygon_data)
            return Polygon(**polygon_data)

    def list_polygons(self) -> List[Polygon]:
        """Return all polygons in the store."""
        return [Polygon(**p) for p in self._db.all()]

    def get_polygon(self, polygon_id: int) -> Optional[Polygon]:
        """Return a polygon by its ID, or None if not found."""
        result = self._db.search(Query().id == polygon_id)
        if result:
            return Polygon(**result[0])
        return None

    def update_polygon(self, polygon_id: int, polygon_in: PolygonUpdate) -> Optional[Polygon]:
        """Update an existing polygon. Returns updated polygon or None if not found."""
        with self._lock:
            time.sleep(5)
            polygon = self.get_polygon(polygon_id)
            if polygon is None:
                return None
            update_data = polygon_in.model_dump(exclude_unset=True)
            updated = polygon.model_dump()
            updated.update(update_data)
            # TinyDB uses doc_id internally; we can update using Query
            self._db.update(updated, Query().id == polygon_id)
            return Polygon(**updated)

    def delete_polygon(self, polygon_id: int) -> bool:
        """Delete a polygon. Returns True if deleted, False if not found."""
        with self._lock:
            time.sleep(5)
            removed_ids = self._db.remove(Query().id == polygon_id)
            return len(removed_ids) > 0


# Singleton instance for ease of use in FastAPI handlers
polygon_store = PolygonStore() 