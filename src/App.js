import React, { useEffect } from 'react';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { Routes, Route, Link } from 'react-router-dom';
import { useWorkout } from './components/common/WorkoutContext';
import ActiveWorkout from './components/ActiveWorkout';
import WorkoutBuilder from './components/WorkoutBuilder';
import WorkoutHistory from './components/WorkoutHistory';
import '@aws-amplify/ui-react/styles.css';
import './App.css';

function App({ signOut, user }) {
  const { fetchWorkouts } = useWorkout();

  useEffect(() => {
    if (user) {
      // Fetch templates and history once user is authenticated
      fetchWorkouts();
    }
  }, [user]);

  return (
    <div className="app-container">
      <header>
        <h1>I WANT ABS 🏋️</h1>
        {user && <button onClick={signOut}>Sign Out</button>}
      </header>

      <main>
        <Routes>
          <Route path="/" element={<ActiveWorkout />} />
          <Route path="/builder" element={<WorkoutBuilder />} />
          <Route path="/history" element={<WorkoutHistory />} />
          <Route path="/summary" element={<WorkoutHistory />} />
        </Routes>
      </main>

      <footer>
        <nav>
          <Link to="/">Active Workout</Link>
          <Link to="/builder">Build Workout</Link>
          <Link to="/history">History</Link>
        </nav>
      </footer>
    </div>
  );
}

export default withAuthenticator(App);
