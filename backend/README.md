# Polygon Management API

This service provides a simple REST API to create, read, update and delete (CRUD) 2-D polygons.

---

## 1. Quick start (local development)

Requirements:
* Python **3.11**
* `pip` (or any PEP-517 compatible installer)

```bash
# 1. Clone / open the repository and create a virtual-env (recommended)
python -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Launch the API (auto-reload enabled)
uvicorn src.main:app --reload --port 8080
```

The API is now reachable at **http://localhost:8080** and interactive docs are available at **/docs**.

All data are stored in `./data/polygons_db.json` relative to the project root.

---

## 2. Run with Docker

Docker is the easiest way to run the service in a clean, isolated environment.

### Build the image

```bash
docker build -t polygons-api .
```

### Run the container

```bash
docker run -d --name polygons \
           -p 8080:8080 \
           polygons-api
```

* `-p 8080:8080` maps container port **8080** to the same port on your host. Feel free to change the host port (left side) if 8080 is already taken, e.g. `-p 9090:8080`.
* Container logs can be tailed with `docker logs -f polygons`.
* Persistent data live inside the container at `/app/data/polygons_db.json`. You can mount it to the host if desired:
  ```bash
  docker run -d --name polygons \
             -p 8080:8080 \
             -v $(pwd)/data:/app/data \
             polygons-api
  ```

---

## 3. Available Endpoints

| Method | Path               | Description                |
|--------|--------------------|----------------------------|
| POST   | `/polygon`         | Create a new polygon       |
| GET    | `/polygons`        | List all polygons          |
| GET    | `/polygon/{id}`    | Retrieve polygon by ID     |
| PUT    | `/polygon/{id}`    | Update polygon             |
| DELETE | `/polygon/{id}`    | Delete polygon             |

Swagger / OpenAPI docs: `http://localhost:8080/docs`

---

## 4. Environment variables

| Variable            | Default       | Purpose                                 |
|---------------------|---------------|-----------------------------------------|
| `UVICORN_WORKERS`   | `1`           | Number of worker processes (Docker)     |
| `POLYGON_DATA_DIR`  | `./data`      | Directory to store the TinyDB JSON file |

---

## 5. Running Tests

```bash
pytest tests
```

---

Enjoy using the Polygon API! 🎉 