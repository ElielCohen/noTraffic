import os
import sys
import tempfile
import time
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning, module="httpx")
warnings.filterwarnings("ignore", category=UserWarning, module="pydantic")

# Ensure both <repo_root> and <repo_root>/backend are on sys.path so that
# `import src`
# Add backend and repo root to path for import flexibility
REPO_ROOT = Path(__file__).resolve().parents[2]
for path in (REPO_ROOT, REPO_ROOT / "backend"):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

# Ensure POLYGON_DATA_DIR points to a temporary directory per session

@pytest.fixture(scope="session", autouse=True)
def _set_data_dir(tmp_path_factory):
    temp_dir = tmp_path_factory.mktemp("data_dir")
    os.environ["POLYGON_DATA_DIR"] = str(temp_dir)
    yield


# Monkey-patch sleep to speed up tests

@pytest.fixture(autouse=True)
def _bypass_sleep(monkeypatch):
    monkeypatch.setattr(time, "sleep", lambda _: None)


# Import app after fixtures
from src.main import app  # noqa: E402

client = TestClient(app)


def _sample_polygon(name: str = "P1"):
    return {"name": name, "points": [[0.0, 0.0], [1.0, 0.0], [1.0, 1.0]]}


def test_crud_flow():
    # Create
    resp = client.post("/polygon", json=_sample_polygon())
    assert resp.status_code == 201
    created = resp.json()
    pid = created["id"]

    # List
    assert client.get("/polygons").status_code == 200

    # Get
    assert client.get(f"/polygon/{pid}").status_code == 200

    # Update
    resp = client.put(f"/polygon/{pid}", json={"name": "new"})
    assert resp.json()["name"] == "new"

    # Delete
    assert client.delete(f"/polygon/{pid}").status_code == 204

    # Confirm 404
    assert client.get(f"/polygon/{pid}").status_code == 404