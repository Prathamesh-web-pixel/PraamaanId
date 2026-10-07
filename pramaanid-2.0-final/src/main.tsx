import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
import React from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";

const container = document.getElementById("root");

if (!container) {
  document.body.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#F4F6F8;color:#17212B;">
      <h1 style="font-size:2rem;font-weight:700;color:#E87524;">PramaanID</h1>
      <p style="margin-top:8px;color:#555;">Critical error: Root element not found. Please refresh.</p>
    </div>
  `;
} else {
  createRoot(container).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
