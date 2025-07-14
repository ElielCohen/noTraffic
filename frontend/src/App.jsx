import React, { useEffect, useState } from 'react';
import PolygonCanvas from './components/PolygonCanvas';
import { getPolygons, deletePolygon, createPolygon, updatePolygon } from './api';
import Loader from './components/Loader';
import InfoModal from './components/InfoModal';
import './css/sidebar.css';

export default function App() {
  const [polygons, setPolygons] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [hiddenIds, setHiddenIds] = useState(new Set());
  const [showInfo, setShowInfo] = useState(true);

  const refresh = async () => {
    const data = await getPolygons();
    setPolygons(data);
    if (!selected && data.length) {
      setSelected(data[0].id);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await refresh();
      } catch (err) {
        console.error(err);
        alert('Failed to load polygons');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (poly) => {
    setLoading(true);
    try {
      const saved = await createPolygon(poly); // returns newly created polygon with id
      // Update local state without full refresh
      setPolygons(prev => {
        const updated = [...prev, saved];
        // Hide all other polygons
        setHiddenIds(new Set(updated.filter(p => p.id !== saved.id).map(p => p.id)));
        return updated;
      });
      setSelected(saved.id);
    } catch (err) {
      console.error(err);
      alert('Failed to save polygon');
    } finally {
      setCreateMode(false);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await deletePolygon(id);
      if (selected === id) setSelected(null);
      await refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to delete polygon');
    } finally {
      setLoading(false);
    }
  };

  const handleViewToggle = (id) => {
    setEditMode(false);
    setCreateMode(false);
    setHiddenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setSelected(id); // now visible, select it
      } else {
        next.add(id);
        if (selected === id) setSelected(null); // deselect if hiding
      }
      return next;
    });
  };

  const handleEdit = (id) => {
    // If already editing this polygon, toggle back to view mode
    if (selected === id && editMode) {
      setEditMode(false);
      return;
    }

    // Switch to edit mode for this polygon
    // hide all other polygons
    setHiddenIds(new Set(polygons.filter(p=>p.id!==id).map(p=>p.id)));
    setSelected(id);
    setEditMode(true);
    setCreateMode(false);
  };

  const handleUpdate = async (id, payload) => {
    setLoading(true);
    try {
      await updatePolygon(id, payload);
      await refresh();
      setEditMode(false); // exit edit mode after successful update
    } catch (err) {
      console.error(err);
      alert('Failed to update polygon');
    } finally {
      setLoading(false);
      setCreateMode(false);
    }
  };

  const toggleShowAll = () => {
    setCreateMode(false);
    if (hiddenIds.size === 0) {
      // hide all
      setHiddenIds(new Set(polygons.map(p=>p.id)));
      setSelected(null);
    } else {
      // show all
      setHiddenIds(new Set());
    }
  };

  return (
    <div className="container">
      {loading && <Loader />}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Polygons</h2>
          <button className="info-btn" title="Information" onClick={() => setShowInfo(true)}>ℹ️</button>
        </div>
        <button className="showall-btn" onClick={toggleShowAll} disabled={editMode}>
          {hiddenIds.size === 0 ? 'Hide All' : 'Show All'}
        </button>
        <ul>
          {polygons.map((p) => (
            <li
              key={p.id}
              className={`${selected === p.id ? 'active' : ''} ${!hiddenIds.has(p.id) ? 'visible' : ''}`.trim()}
              onClick={() => {
                // Show only this polygon
                setSelected(p.id);
                setEditMode(false);
                setCreateMode(false);
                setHiddenIds(new Set(polygons.filter(pl => pl.id !== p.id).map(pl => pl.id)));
              }}
            >
              <span className="poly-name">{p.name}</span>
              <div className="row-actions" onClick={(e)=>e.stopPropagation()}>
                <button className="view" title="Show / Hide" onClick={(e) => {e.stopPropagation(); handleViewToggle(p.id);}} disabled={editMode}>
                  {!hiddenIds.has(p.id) ? '🚫' : '👁'}
                </button>
                <button className="edit" title={selected===p.id && editMode ? 'Exit edit' : 'Edit'} onClick={(e)=>{e.stopPropagation(); handleEdit(p.id);}}>
                  {selected === p.id && editMode ? '✅' : '✎'}
                </button>
                <button className="delete" title="Delete" onClick={(e)=>{e.stopPropagation(); handleDelete(p.id);}}>
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
        <button
          className="new-btn"
          onClick={() => {
            if (createMode) {
              // Cancel creation: exit create mode and show all polygons
              setCreateMode(false);
              setHiddenIds(new Set());
            } else {
              // Start creation: hide all existing polygons
              setSelected(null);
              setEditMode(false);
              setCreateMode(true);
              setHiddenIds(new Set(polygons.map(pl => pl.id)));
            }
          }}
          disabled={editMode}
        >
          {createMode ? 'Cancel' : '+ New Polygon'}
        </button>
      </aside>
      <main className="main">
        <PolygonCanvas
          key={selected || (createMode ? 'new' : 'none')}
          polygon={polygons.find((p) => p.id === selected)}
          otherPolygons={polygons.filter(pl=>!hiddenIds.has(pl.id))}
          onSave={handleSave}
          onUpdate={handleUpdate}
          editMode={editMode}
          createMode={createMode}
        />
        <InfoModal visible={showInfo} onClose={() => setShowInfo(false)} />
      </main>
    </div>
  );
} 