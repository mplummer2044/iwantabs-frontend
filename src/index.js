import React from 'react';
import ReactDOM from 'react-dom/client';
import { WorkoutProvider } from './components/common/WorkoutContext';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Amplify } from 'aws-amplify';
import awsConfig from './aws-exports';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

// Configure Amplify with your settings
Amplify.configure(awsConfig);

// Wrap your App component with authentication
const AppWithAuth = withAuthenticator(App, {
  signUpAttributes: ['email'], // Fields for signup
  loginMechanisms: ['email']   // Login with email
});

// Create root and render the authenticated app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <WorkoutProvider>
      <App />
    </WorkoutProvider>
  </React.StrictMode>
);

// Performance monitoring (optional)
reportWebVitals();
