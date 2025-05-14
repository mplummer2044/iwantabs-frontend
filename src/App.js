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

  // Correctly utilize useWorkout hook to get state and dispatch
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

  // User Authentication & Data Loading Section
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { tokens } = await fetchAuthSession();
        if (!tokens?.idToken?.payload?.sub) {
          throw new Error("No user ID in token");
        }
        
        setCurrentUser({
          username: tokens.idToken.payload.sub,
          email: tokens.idToken.payload.email,
        });
        fetchWorkouts();
      } catch (err) {
        console.log("User not signed in", err);
      }
    };
    loadUser();
  }, []);

  // Workout Data Fetching
  const fetchWorkouts = async () => {
    if (!currentUser?.username) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { tokens } = await fetchAuthSession();
      const res = await axios.get(`${API_BASE}/templates`, {
        headers: {
          Authorization: `Bearer ${tokens?.idToken?.toString()}`,
        },
      });

      const sortedHistory = (res.data.history || []).sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      dispatch({
        type: 'LOAD_TEMPLATES',
        payload: {
          templates: res.data.templates || [],
          history: sortedHistory,
        },
      });
    } catch (err) {
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

const updateSetStatus = (exerciseIndex, setIndex, status) => {
  const updatedExercises = [...activeWorkout.exerciseList];
  updatedExercises[exerciseIndex].sets[setIndex].status = status;
  setActiveWorkout({ ...activeWorkout, exerciseList: updatedExercises });
};

const cycleSetStatus = (exerciseIndex, setIndex) => {
  const statuses = ['good', 'medium', 'bad'];
  const currentStatus = activeWorkout.exerciseList[exerciseIndex].sets[setIndex].status;
  const newStatus = statuses[(statuses.indexOf(currentStatus) + 1) % 3];
  updateSetStatus(exerciseIndex, setIndex, newStatus);
};

const formatTimeInput = (value) => {
  if (!value) return '';
  
  // Remove non-numeric characters except colon
  let cleaned = value.replace(/[^0-9:]/g, '');
  
  // Handle backspace/delete
  if (cleaned.length < value.length) return cleaned;

  // Auto-insert colon after 2 digits
  if (cleaned.length === 2 && !cleaned.includes(':')) {
    return cleaned + ':';
  }
  
  // If user types past 2 digits without colon, auto-format
  if (cleaned.length > 2 && !cleaned.includes(':')) {
    cleaned = cleaned.slice(0, 2) + ':' + cleaned.slice(2);
  }

  // Prevent more than 5 characters (00:00)
  return cleaned.substring(0, 5);
};

const validateTimeInput = (value) => {
  // Allow intermediate formats during typing
  return /^\d{0,2}:?\d{0,2}$/.test(value);
};

const updateSetValue = (exerciseIndex, setIndex, field, value) => {
  const updatedExercises = [...activeWorkout.exerciseList];
  
  // Special handling for time fields
  if (field === 'time') {
    updatedExercises[exerciseIndex].sets[setIndex].values[field] = value || null;
  } else {
    updatedExercises[exerciseIndex].sets[setIndex].values[field] = 
      value === '' ? null : Number(value);

    // Autofill logic for reps in first set
    if (field === 'reps' && setIndex === 0 && updatedExercises[exerciseIndex].measurementType === 'weights') {
      const newRepsValue = value === '' ? null : Number(value);
      for (let i = 1; i < updatedExercises[exerciseIndex].sets.length; i++) {
        if (updatedExercises[exerciseIndex].sets[i].values.reps === null) {
          updatedExercises[exerciseIndex].sets[i].values.reps = newRepsValue;
        }
      }
    }

    // NEW: Autofill logic for weight in first set
    if (field === 'weight' && setIndex === 0 && updatedExercises[exerciseIndex].measurementType === 'weights') {
      const baseWeight = value === '' ? null : Number(value);
      
      if (baseWeight !== null) {
        // Calculate +5 per subsequent set
        updatedExercises[exerciseIndex].sets.forEach((set, idx) => {
          if (idx > 0) {
            set.values.weight = baseWeight + (5 * idx);
          }
        });
      } else {
        // Clear subsequent weights if first is empty
        updatedExercises[exerciseIndex].sets.forEach((set, idx) => {
          if (idx > 0) set.values.weight = null;
        });
      }
    }
  }
  
  setActiveWorkout({ ...activeWorkout, exerciseList: updatedExercises });
};

// Add this function before the return statement
const renderSetValues = (measurementType, values) => {
  if (!values) return null;
  
  switch (measurementType) {
    case 'weights':
      return (
        <span>
          {values.weight || '-'} × {values.reps || '-'}
        </span>
      );
    case 'timed':
      return <span>{values.time || '-'}</span>;
    case 'cardio':
      return <span>{values.distance || '-'} mi</span>;
    default:
      return null;
  }
};

const saveWorkoutProgress = async () => {
  try {
    if (!activeWorkout) {
      alert('No active workout to save');
      return;
    }

    const { tokens } = await fetchAuthSession();
    
    // Transform the data to match your API's expected format
    const workoutData = {
      userID: currentUser.username,
      workoutID: activeWorkout.workoutID,
      templateID: activeWorkout.templateID,
      createdAt: activeWorkout.createdAt,
      completedAt: new Date().toISOString(),
      isTemplate: false,
      exerciseList: activeWorkout.exerciseList.map(exercise => ({
        name: exercise.name,
        exerciseID: exercise.exerciseID,
        measurementType: exercise.measurementType,
        sets: exercise.sets.map(set => ({
          values: {
            weight: set.values.weight ? Number(set.values.weight) : null,
            reps: set.values.reps ? Number(set.values.reps) : null,
            distance: set.values.distance ? Number(set.values.distance) : null,
            time: set.values.time || null
          },
          status: set.status || 'pending'
        }))
      })),
      // Only include if your API expects it
      ...(activeWorkout.previousWorkouts && { previousWorkouts: activeWorkout.previousWorkouts })
    };

    const response = await axios.post(API_BASE, workoutData, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens?.idToken?.toString()}`
      }
    });

    console.log('Workout saved successfully:', response.data);
    await fetchWorkouts(); // Refresh your workout list
    setActiveWorkout(null); // Close the active workout
    console.log("Active Workout Structure:", JSON.stringify(activeWorkout, null, 2));
    return response.data;
  } catch (err) {
    console.error("Save failed:", {
      error: err,
      message: err.message,
      response: err.response?.data
    });
    alert(`Failed to save workout: ${err.response?.data?.message || err.message}`);
    throw err;
  }
};

const calculateWorkoutDuration = (workout) => {
  if (!workout.createdAt || !workout.completedAt) return '--';
  const start = new Date(workout.createdAt);
  const end = new Date(workout.completedAt);
  return Math.round((end - start) / (1000 * 60)); // Returns minutes
};


// UI Components Section
// ----------------------
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