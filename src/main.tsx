import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initializeFirebaseOffline } from './utils/firebase/offline';
import './styles/scrollbar.css';
import './index.css';

// Initialize Firebase offline support
initializeFirebaseOffline().catch(console.error);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);