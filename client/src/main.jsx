import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';   // R15S1E1
import App from './App';
import { P, T, FONT, MONO } from './tokens';

// R21S1E1-US1 — test hook: design tokens observable from Playwright.
window.__TOKENS__ = { P, T, FONT, MONO };

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
