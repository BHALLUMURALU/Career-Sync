import React from 'react';
import ReactDOM from 'react-dom/client';
import './output.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './context/Authcontext';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);

reportWebVitals();
