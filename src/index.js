import React from 'react';
import { Amplify } from 'aws-amplify';
import awsConfig from './aws-exports';
// Configure Amplify with AWS Cognito/API settings
Amplify.configure(awsConfig);
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
