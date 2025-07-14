from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field, conlist, field_validator

# Define a Point as exactly two numerical coordinates [x, y]
Point = conlist(float, min_length=2, max_length=2)  # type: ignore[type-arg]


class PolygonBase(BaseModel):
    """Shared attributes for Polygon models."""

    name: str = Field(..., description="Human-friendly polygon name", json_schema_extra={"example": "P1"})
    points: List[Point] = Field(
        ..., description="Ordered list of 2-D points", json_schema_extra={"example": [[12.3, 12.0], [16.3, 12.0], [16.3, 8.0], [12.3, 8.0]]}
    )

    # Ensure we have at least three vertices to form a polygon
    @field_validator("points")
    def check_minimum_points(cls, v: List[Point]):  # noqa: N805
        if len(v) < 3:
            raise ValueError("A polygon must have at least three points")
        return v


class PolygonCreate(PolygonBase):
    """Payload for polygon creation (ID generated server-side)."""


class PolygonUpdate(BaseModel):
    """Payload for polygon updates (all fields optional)."""

    name: str | None = Field(None, description="Updated polygon name")
    points: List[Point] | None = Field(None, description="Updated list of points")

    @field_validator("points")
    def check_points_not_empty(cls, v):  # noqa: N805
        if v is not None and len(v) < 3:
            raise ValueError("If provided, points must include at least three vertices")
        return v


class Polygon(PolygonBase):
    """Representation returned by the API (includes generated ID)."""

    id: int = Field(..., description="Unique polygon identifier", json_schema_extra={"example": 1})

    model_config = {"from_attributes": True} 