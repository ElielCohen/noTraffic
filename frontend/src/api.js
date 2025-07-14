const BASE = '';

export async function getPolygons() {
  const res = await fetch(`${BASE}/polygons`);
  return res.json();
}

export async function createPolygon(payload) {
  const res = await fetch(`${BASE}/polygon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function deletePolygon(id) {
  await fetch(`${BASE}/polygon/${id}`, { method: 'DELETE' });
}

export async function updatePolygon(id, payload) {
  const res = await fetch(`${BASE}/polygon/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
} 