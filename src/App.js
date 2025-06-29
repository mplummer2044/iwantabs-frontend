// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { useWorkout } from './components/common/WorkoutContext';
import ActiveWorkout from './components/ActiveWorkout';
import WorkoutBuilder from './components/WorkoutBuilder';
import WorkoutHistory from './components/WorkoutHistory';
import { parseDynamoDBItem } from './components/common/WorkoutContext';
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
        return <ActiveWorkout
        onStartWorkout={startWorkout}
        onFinishWorkout={() => setView('history')}
      />;     
    }
  };

  // User Authentication & Data Loading
  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log("Loading user...");
        const { tokens } = await fetchAuthSession();
        if (!tokens?.idToken?.payload?.sub) {
          throw new Error("No user ID in token");
        }
  
        // Properly set the user
        const user = {
          username: tokens.idToken.payload.sub,
          email: tokens.idToken.payload.email,
        };
        setCurrentUser(user);
        console.log("User successfully loaded:", user);
      } catch (err) {
        console.error("User not signed in", err);
      }
    };
    loadUser();
  }, []);
  
  // Separate useEffect to fetch workouts AFTER user is set
  useEffect(() => {
    if (currentUser?.username) {
      console.log("User data confirmed, now fetching workouts...");
      fetchWorkouts(currentUser.username);
    }
  }, [currentUser]);  // Trigger when currentUser changes 

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
  
      console.log("Raw Template Data:", template);
  
      // Normalize sets to always be an array of set objects
      const normalizeSets = (sets) => {
        if (Array.isArray(sets)) {
          return sets;  // Already an array, return as is
        }
  
        if (typeof sets === 'number') {
          console.log("Normalizing number of sets to array:", sets);
          // Convert a number into an array of objects
          return Array.from({ length: sets }, () => ({
            values: { reps: null, weight: null, distance: null, time: null },
            status: 'pending',
          }));
        }
  
        console.warn("Unexpected sets format, defaulting to empty array:", sets);
        return [];
      };
  
      // Normalize each exercise's sets during mapping
      const exerciseList = template.exercises.map((exercise) => {
        // Fix the `sets` field by forcing it to be an array
        const normalizedSets = normalizeSets(exercise.sets);
        console.log(`Normalized sets for ${exercise.name}:`, normalizedSets);
        return {
          ...exercise,
          sets: normalizedSets,
        };
      });
  
      console.log("Structured Exercise List after normalization:", exerciseList);
  
      const newWorkout = {
        userID: currentUser.username,
        workoutID: `workout_${Date.now()}`,
        templateID: template.templateID,
        createdAt: new Date().toISOString(),
        exerciseList,
        previousWorkouts: previousWorkouts.map((workout) => ({
          ...workout,
          exerciseList: workout.exerciseList || [],
        })),
      };
  
      console.log("New Workout Object (Post Normalization):", newWorkout);
      dispatch({ type: 'SET_ACTIVE_WORKOUT', payload: newWorkout });
    } catch (err) {
      console.error("Error starting workout:", err.message);
      dispatch({ type: 'SET_ERROR', payload: err.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };
  
  
  
      // Normalize sets to always be an array of set objects
      const normalizeSets = (sets) => {
        // Case 1: If sets is already an array, return as-is
        if (Array.isArray(sets)) return sets;

        // Case 2: If sets is a number, convert it to an array of set objects
        if (typeof sets === 'number') {
          return Array.from({ length: sets }, () => ({
            values: { reps: null, weight: null, distance: null, time: null },
            status: 'pending',
          }));
        }

        // Case 3: If sets is something else (like null or undefined), return an empty array
        console.warn("Unexpected sets format, defaulting to empty array:", sets);
        return [];
      }; 

  //Verify Start of Workout
  useEffect(() => {
    if (activeWorkout) {
      console.log("Active Workout Data (after fix):", JSON.stringify(activeWorkout, null, 2));
      if (!Array.isArray(activeWorkout.exerciseList)) {
        console.warn("Exercise list is not an array (post-fix):", activeWorkout.exerciseList);
      } else if (activeWorkout.exerciseList.length === 0) {
        console.warn("Exercise list is empty (post-fix):", activeWorkout.exerciseList);
      } else {
        console.log("Exercise list loaded correctly (post-fix):", activeWorkout.exerciseList);
      }
    }
  }, [activeWorkout]);
  
  
  
  
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
