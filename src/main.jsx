import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/style.css';

// Do not wrap the app in React.StrictMode here.
// The exam-start page performs one-time browser side effects:
// fullscreen request, camera permission, and backend session creation.
// In Vite dev mode, StrictMode runs effects twice and can leave the exam
// page stuck on the loading spinner after fullscreen is accepted.
createRoot(document.getElementById('root')).render(
  <HashRouter>
    <App />
  </HashRouter>,
);