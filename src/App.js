// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { useWorkout } from './components/common/WorkoutContext';
import ActiveWorkout from './components/ActiveWorkout';
import WorkoutBuilder from './components/WorkoutBuilder';
import WorkoutHistory from './components/WorkoutHistory';
import '@aws-amplify/ui-react/styles.css';
import './App.css';

const API_BASE = 'https://4tb1rc24q2.execute-api.us-east-1.amazonaws.com/Prod';

function App({ signOut, user }) {
  const [view, setView] = useState('active');
  const [currentUser, setCurrentUser] = useState(null);
  const [touchStartY, setTouchStartY] = useState(0);

  const { state, dispatch } = useWorkout();
  const { workoutTemplates, workoutHistory, loading, activeWorkout } = state;

  const [currentTemplate, setCurrentTemplate] = useState({
    name: '',
    exercises: [{
      name: '',
      measurementType: 'weights',
      sets: 1,
      previousStats: null,
    }],
  });

  const renderView = () => {
    switch (view) {
      case 'builder':
        return <WorkoutBuilder />;
      case 'history':
        return <WorkoutHistory />;
      default:
        return <ActiveWorkout />;
    }
  };

  // User Authentication & Data Loading
// src/App.js
useEffect(() => {
  const loadUser = async () => {
    try {
      const { tokens } = await fetchAuthSession();
      if (!tokens?.idToken?.payload?.sub) {
        throw new Error("No user ID in token");
      }

      // Set the user and wait for the state update
      const user = {
        username: tokens.idToken.payload.sub,
        email: tokens.idToken.payload.email,
      };
      setCurrentUser(user);
      console.log("User successfully loaded:", user);

      // Wait for state to update, then fetch workouts
      setTimeout(async () => {
        await fetchWorkouts();
      }, 100);
    } catch (err) {
      console.error("User not signed in", err);
    }
  };
  loadUser();
}, []);


  // Fetch Workouts
  const fetchWorkouts = async () => {
    if (!currentUser?.username) {
      console.warn("No user found while fetching workouts");
      return;
    }
  
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { tokens } = await fetchAuthSession();
      const res = await axios.get(`${API_BASE}/templates`, {
        headers: {
          Authorization: `Bearer ${tokens?.idToken?.toString()}`,
        },
      });
  
      const templates = Array.isArray(res.data.templates) ? res.data.templates : [];
      const sortedHistory = (res.data.history || []).sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );
  
      console.log("Loaded Templates:", templates);  // Log to verify
  
      dispatch({
        type: 'LOAD_TEMPLATES',
        payload: {
          templates: templates,
          history: sortedHistory,
        },
      });
    } catch (err) {
      console.error("Error fetching workouts:", err.message);
      dispatch({ type: 'SET_ERROR', payload: err.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }; 

  // Start a Workout
  const startWorkout = async (template) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { tokens } = await fetchAuthSession();
      const { data: previousWorkouts = [] } = await axios.get(`${API_BASE}/history`, {
        params: { templateID: template.templateID, limit: 2 },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.idToken?.toString()}`,
        },
      });

      const newWorkout = {
        userID: currentUser.username,
        workoutID: `workout_${Date.now()}`,
        templateID: template.templateID,
        createdAt: new Date().toISOString(),
        exerciseList: template.exercises.map((exercise) => ({
          ...exercise,
          sets: Array(exercise.sets || 1).fill().map(() => ({
            values: { reps: null, weight: null, distance: null, time: null },
            status: 'pending',
          })),
        })),
        previousWorkouts: previousWorkouts.map((workout) => ({
          ...workout,
          exerciseList: workout.exerciseList || [],
        })),
      };

      dispatch({ type: 'SET_ACTIVE_WORKOUT', payload: newWorkout });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Calculate Workout Duration
  const calculateWorkoutDuration = (workout) => {
    if (!workout.createdAt || !workout.completedAt) return '--';
    const start = new Date(workout.createdAt);
    const end = new Date(workout.completedAt);
    return Math.round((end - start) / (1000 * 60)); // Minutes
  };

//UI Components
return (
  <div>
    <header>
      <h1>I WANT ABS 🏋️</h1>
      {user && <button onClick={signOut}>Sign Out</button>}
    </header>
    {renderView()}
    <footer>
      <button onClick={() => setView('active')}>Active Workout</button>
      <button onClick={() => setView('builder')}>Build Workout</button>
      <button onClick={() => setView('history')}>History</button>
    </footer>
  </div>
);
}


export default withAuthenticator(App);
