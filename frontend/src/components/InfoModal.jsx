import React from 'react';
import '../css/modal.css';

export default function InfoModal({ visible, onClose }) {
  if (!visible) return null;

  const handleOverlayClick = () => onClose();
  const stopPropagation = (e) => e.stopPropagation();

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" onClick={stopPropagation}>
        <button className="close-btn" onClick={onClose}>✕</button>
        <h3 className="modal-title">Hi Guy,</h3>
        <p>I have went a bit further than requested, adding the capability to edit an existing polygon. You will be able to move it, resize it, or add edges to it easily.</p>
        <p>Have fun with it :)</p>
        <p className="modal-signature">Eliel</p>
      </div>
    </div>
  );
} 