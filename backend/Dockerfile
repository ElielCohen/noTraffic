# syntax=docker/dockerfile:1
# -------------------------------
# Production-ready Dockerfile for Polygon API
# -------------------------------

# 1. Use an official lightweight Python image.
FROM python:3.11-slim AS base

# 2. Set environment variables.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    POETRY_VIRTUALENVS_CREATE=false

# 3. Install system dependencies (none required for TinyDB/FastAPI).
#    We still ensure apt lists are up to date for potential future extensions.
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 4. Establish working directory.
WORKDIR /app

# 5. Install Python dependencies.
COPY requirements.txt ./
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# 6. Copy application code after installing dependencies to leverage Docker cache.
COPY src/ ./src/
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# 7. Expose the port FastAPI will run on.
EXPOSE 8080

# 8. Use a non-root user for security (optional but recommended).
RUN adduser --disabled-password --gecos "" polygonuser \
    && mkdir -p /app/data \
    && chown -R polygonuser:polygonuser /app
USER polygonuser

# 9. Launch the application.
ENTRYPOINT ["/app/entrypoint.sh"] 