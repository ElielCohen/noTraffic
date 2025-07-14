import React, { useEffect, useRef, useState } from 'react';
import '../css/canvas.css';

const BG_URL = 'https://picsum.photos/1920/1080';

export default function PolygonCanvas({ polygon, otherPolygons = [], editMode, createMode, onSave, onUpdate }) {
  const canvasRef = useRef(null);
  const [points, setPoints] = useState(polygon?.points || []);
  const [name, setName] = useState(polygon?.name || '');
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [draggingPolygon, setDraggingPolygon] = useState(false); // dragging whole shape
  const dragStartRef = useRef([0, 0]);
  const skipClickRef = useRef(false);
  const [originalPoints, setOriginalPoints] = useState(polygon?.points || []);
  const [originalName, setOriginalName] = useState(polygon?.name || '');
  const ctxRef = useRef(null);
  // Info label helpers
  const visibleCount = otherPolygons.length;
  const visibleLabel = visibleCount === 1 ? otherPolygons[0]?.name : `${visibleCount} polygons`;
  const [bgLoaded, setBgLoaded] = useState(false);
  const imgRef = useRef(new Image());
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 450 });
  const HIT_RADIUS = 40; // pixels – how close a click must be to an existing vertex to count as a hit

  // Resize canvas to fill viewport minus sidebar
  useEffect(() => {
    const sidebarWidth = 250; // matches CSS
    const updateSize = () => {
      setCanvasSize({ w: window.innerWidth - sidebarWidth, h: window.innerHeight });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Load background once
  useEffect(() => {
    imgRef.current.src = BG_URL;
    imgRef.current.onload = () => {
      setBgLoaded(true);
      draw();
    };
  }, []);

  // Sync when polygon prop changes (edit mode switch)
  useEffect(() => {
    if (polygon) {
      setPoints(polygon.points);
      setName(polygon.name);
      setOriginalPoints(polygon.points);
      setOriginalName(polygon.name);
    } else {
      setPoints([]);
      setName('');
      setOriginalPoints([]);
      setOriginalName('');
    }
  }, [polygon]);

  // Reset unsaved edits when exiting edit mode
  useEffect(() => {
    if (!editMode && polygon) {
      setPoints(polygon.points);
      setName(polygon.name);
    }
  }, [editMode]);

  // Redraw when relevant data changes
  useEffect(() => {
    if (!bgLoaded) return;
    draw();
  }, [bgLoaded, points, editMode, otherPolygons, canvasSize]);

  function canvasPos(evt) {
    const rect = canvasRef.current.getBoundingClientRect();
    return [evt.clientX - rect.left, evt.clientY - rect.top];
  }

  function handleClick(e) {
    if (skipClickRef.current) {
      skipClickRef.current = false;
      return; // ignore click following a drag
    }
    const [x, y] = canvasPos(e);

    if (editMode && polygon) {
      // In edit mode allow add/remove vertices
      const idx = points.findIndex(([px, py]) => Math.hypot(px - x, py - y) < HIT_RADIUS);
      if (idx !== -1) {
        // Clicked on existing point -> remove if polygon still has >=4 points
        if (points.length > 3) {
          setPoints(points.filter((_, i) => i !== idx));
        }
      } else if (!pointInPolygon(points, x, y)) {
        // Insert new vertex only if click is near edge/outside, not inside the polygon
        // Insert new vertex at closest segment
        let minDist = Infinity;
        let insertIdx = points.length; // default append
        for (let i = 0; i < points.length; i++) {
          const [x1, y1] = points[i];
          const [x2, y2] = points[(i + 1) % points.length];
          const dist = pointToSegmentDist(x, y, x1, y1, x2, y2);
          if (dist < minDist) {
            minDist = dist;
            insertIdx = i + 1;
          }
        }
        setPoints(prev => {
          const clone = [...prev];
          clone.splice(insertIdx, 0, [x, y]);
          return clone;
        });
      } else {
        // click inside polygon but not dragged – do nothing
      }
      return;
    }

    if (polygon || editMode) return; // creation only
    setPoints([...points, [x, y]]);
  }

  function handleMouseDown(e) {
    if (!editMode || !polygon) return; // only editing when editMode
    const [x, y] = canvasPos(e);
    const idx = points.findIndex(([px, py]) => Math.hypot(px - x, py - y) < HIT_RADIUS);
    if (idx !== -1) {
      setDraggingIdx(idx);
      skipClickRef.current = false;
    } else if (pointInPolygon(points, x, y)) {
      // clicked inside polygon – start dragging whole shape
      dragStartRef.current = [x, y];
      setDraggingPolygon(true);
      skipClickRef.current = false;
    }
  }

  function handleMouseMove(e) {
    if (draggingIdx === null && !draggingPolygon) return;
    const [x, y] = canvasPos(e);
    if (draggingPolygon) {
      const [sx, sy] = dragStartRef.current;
      const dx = x - sx;
      const dy = y - sy;
      if (dx !== 0 || dy !== 0) {
        setPoints(prev => prev.map(([px, py]) => [px + dx, py + dy]));
        dragStartRef.current = [x, y];
      }
    } else if (draggingIdx !== null) {
      setPoints(prev => prev.map((pt, i) => (i === draggingIdx ? [x, y] : pt)));
    }
    skipClickRef.current = true; // mark as drag
  }

  function handleMouseUp() {
    if (draggingIdx !== null) {
      setDraggingIdx(null);
    }
    if (draggingPolygon) {
      setDraggingPolygon(false);
    }
    // Do not trigger API update automatically; user will press Update button
  }

  function handleUndo() {
    setPoints(points.slice(0, -1));
  }

  function handleClear() {
    setPoints([]);
    setName('');
  }

  function handleSave() {
    if (!name.trim() || points.length < 3) return;
    onSave({ name, points });
    handleClear();
  }

  function handleRevert() {
    setPoints(originalPoints);
    setName(originalName);
  }

  function pointToSegmentDist(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    const dx = px - xx;
    const dy = py - yy;
    return Math.hypot(dx, dy);
  }

  // Ray-casting algorithm to determine if point is inside polygon
  function pointInPolygon(pts, x, y) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1];
      const xj = pts[j][0], yj = pts[j][1];
      const intersect = ((yi > y) !== (yj > y)) &&
        (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = ctxRef.current || canvas.getContext('2d');
    ctxRef.current = ctx;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background (cover, crop to avoid distortion)
    const img = imgRef.current;
    const imgAspect = img.width / img.height;
    const canvasAspect = canvas.width / canvas.height;
    let sx = 0, sy = 0, sW = img.width, sH = img.height;
    if (canvasAspect > imgAspect) {
      // wider canvas, crop vertical
      sH = img.width / canvasAspect;
      sy = (img.height - sH) / 2;
    } else {
      // taller canvas, crop horizontal
      sW = img.height * canvasAspect;
      sx = (img.width - sW) / 2;
    }
    ctx.drawImage(img, sx, sy, sW, sH, 0, 0, canvas.width, canvas.height);

    // Draw background polygons (static) - only if background ready
    if (!bgLoaded) return;

    // Draw background polygons (static)
    otherPolygons.forEach((poly) => {
      if (!poly.points || poly.id === polygon?.id) return;
      ctx.save();
      ctx.beginPath();
      poly.points.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      ctx.fillStyle = 'rgba(0,128,255,0.5)';
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.restore();
    });

    // Determine which point array to render for filled polygon
    const polyPts = editMode ? points : polygon?.points;

    // Draw filled polygon if available
    if (polyPts && polyPts.length >= 3) {
      ctx.save();
      ctx.beginPath();
      polyPts.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();

      // shadow & fill
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = 'rgba(0, 128, 255, 0.3)';
      ctx.fill();

      // white border
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.restore();
    }

    // Draw current points / handles only when creating or editing
    if (editMode || !polygon) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach(([x, y], i) => {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={canvasSize.w}
        height={canvasSize.h}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`canvas-element ${editMode && polygon ? 'pointer' : 'crosshair'}`}
      />
      {visibleCount > 0 && (
        <div className="visible-label">
          {visibleLabel}
        </div>
      )}
      { (createMode || editMode) && (
        <div className="controls">
          {(!editMode && !createMode) ? (
            visibleCount > 0 && (
              <span className="poly-title">{visibleLabel}</span>
            )
          ) : (
            <input
              type="text"
              placeholder="Polygon name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={polygon && !editMode}
            />
          )}
          {(editMode || createMode) && polygon ? (
            <>
              <button onClick={handleRevert} disabled={name===originalName && JSON.stringify(points)===JSON.stringify(originalPoints)}>
                Undo
              </button>
              <button onClick={() => {
                onUpdate(polygon.id, { name, points });
                setOriginalPoints(points);
                setOriginalName(name);
              }} disabled={points.length < 3 || !name.trim()}>
                Update
              </button>
            </>
          ) : (
            !polygon && createMode && (
              <>
                <button onClick={handleUndo} disabled={!points.length}>
                  Undo
                </button>
                <button onClick={handleClear} disabled={!points.length}>
                  Clear
                </button>
                <button onClick={handleSave} disabled={points.length < 3 || !name.trim()}>
                  Save
                </button>
              </>
            )
          )}
        </div>
      ) }
    </div>
  );
} 