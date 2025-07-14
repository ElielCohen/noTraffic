from __future__ import annotations

from typing import List

from fastapi import FastAPI, HTTPException, status, Response

from .models import Polygon, PolygonCreate, PolygonUpdate
from .store import polygon_store

app = FastAPI(
    title="Polygon Management API",
    description="CRUD API for managing 2-D polygons used in mapping/geospatial contexts.",
    version="1.0.0",
)


@app.post(
    "/polygon",
    response_model=Polygon,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new polygon",
    response_description="The newly created polygon",
)
async def create_polygon(polygon_in: PolygonCreate) -> Polygon:
    """Create a polygon with a unique ID and persist it."""
    polygon = polygon_store.create_polygon(polygon_in)
    return polygon


@app.get(
    "/polygons",
    response_model=List[Polygon],
    summary="List all polygons",
    response_description="List of stored polygons",
)
async def list_polygons() -> List[Polygon]:
    """Retrieve all polygons from the data store."""
    return polygon_store.list_polygons()


@app.get("/polygon/{polygon_id}", response_model=Polygon, summary="Get a polygon by ID", response_description="The requested polygon")
async def get_polygon(polygon_id: int) -> Polygon:
    """Retrieve a polygon by its ID."""
    polygon = polygon_store.get_polygon(polygon_id)
    if polygon is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Polygon not found")
    return polygon


@app.put(
    "/polygon/{polygon_id}",
    response_model=Polygon,
    summary="Update an existing polygon",
    response_description="The updated polygon",
)
async def update_polygon(polygon_id: int, polygon_in: PolygonUpdate) -> Polygon:
    """Update a polygon's name and/or points by ID."""
    polygon = polygon_store.update_polygon(polygon_id, polygon_in)
    if polygon is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Polygon not found")
    return polygon


@app.delete(
    "/polygon/{polygon_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a polygon",
    response_class=Response,
)
async def delete_polygon(polygon_id: int) -> Response:
    """Delete a polygon by its ID."""
    deleted = polygon_store.delete_polygon(polygon_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Polygon not found")
    # 204 response must not include a body; return an empty Response
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ------------------------- Application entrypoint -------------------------

# When using `uvicorn backend.main:app` this block is ignored, but allows
# running `python -m backend.main` directly during local development.
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8080, reload=True) 