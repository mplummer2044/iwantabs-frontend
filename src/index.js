import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { WorkoutProvider } from './components/common/WorkoutContext';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <WorkoutProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </WorkoutProvider>
  </React.StrictMode>
);
