// src/App.jsx
import React from 'react';
import AppRoutes from './routes/AppRoutes';
import 'leaflet/dist/leaflet.css';

function App() {
  return (
    <div className="App">
      <AppRoutes />
    </div>
  );
}

export default App;