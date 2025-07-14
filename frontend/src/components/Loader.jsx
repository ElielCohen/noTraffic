import React from 'react';

export default function Loader() {
  return (
    <div className="loader-overlay">
      <div className="spinner" />
      <p>Please wait, processing your request...</p>
    </div>
  );
} 