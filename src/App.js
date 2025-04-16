import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';

const API_BASE = 'https://4tb1rc24q2.execute-api.us-east-1.amazonaws.com/Prod';

function App({ signOut, user }) {
  // State Management Section
  // -------------------------
  // Track workout templates and active workout session
  const [workoutTemplates, setWorkoutTemplates] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  
  // Manage template creation form state
  const [currentTemplate, setCurrentTemplate] = useState({
    name: '',
    exercises: [{
      name: '',
      measurementType: 'weights',
      sets: 1,
      previousStats: null
    }]
  });
  
  // Track workout history and loading states
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // User Authentication & Data Loading Section
  // ------------------------------------------
  // In your user loading useEffect
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { tokens } = await fetchAuthSession();
        if (!tokens?.idToken?.payload?.sub) {
          throw new Error("No user ID in token");
        }
        
        setCurrentUser({
          username: tokens.idToken.payload.sub,
          email: tokens.idToken.payload.email
        });
        fetchWorkouts();
      } catch (err) {
        console.log("User not signed in", err);
        // Redirect to login if needed
      }
    };
    loadUser();
  }, []);

  // Template and Workout Data Fetching
  // ----------------------------------
  useEffect(() => {
    if (currentUser?.username) {
      fetchWorkouts();
    }
  }, [currentUser]);

  const fetchWorkouts = async () => {
    if (!currentUser?.username) return;
    
    setLoading(true);
    try {
      const { tokens } = await fetchAuthSession();
      const res = await axios.get(`${API_BASE}/templates`, {
        headers: {
          Authorization: tokens?.idToken?.toString()
        }
      });
      
      // Sort history by date descending
      const sortedHistory = (res.data.history || []).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
  
      setWorkoutTemplates(res.data.templates || []);
      setWorkoutHistory(sortedHistory);
    } catch (err) {
      console.error("Fetch error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Template Creation Logic
  // -----------------------
  const createWorkoutTemplate = async () => {
    try {
      const { tokens } = await fetchAuthSession();
      const templateWithIDs = {
        ...currentTemplate,
        exercises: currentTemplate.exercises.map(ex => ({
          ...ex,
          exerciseID: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })),
        userID: currentUser.username
      };

      const response = await axios.post(`${API_BASE}/templates`, templateWithIDs, {
        headers: { Authorization: `Bearer ${tokens?.idToken?.toString()}` }
      });
        
        setWorkoutTemplates(prev => [...prev, response.data]);
        setCurrentTemplate({ 
          name: '', 
          exercises: [{
            name: '',
            measurementType: 'weights',
            sets: 1,
            previousStats: null
          }]
        });
      } catch (err) {
        console.error("Creation failed:", err.response?.data || err.message);
      }
    };

 // Workout Session Management
// --------------------------
const startWorkout = async (template) => {
  try {
    const { tokens } = await fetchAuthSession();
    const { data: previousWorkouts = [] } = await axios.get(`${API_BASE}/history`, {
      params: { 
        templateID: template.templateID,
        limit: 2
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens?.idToken?.toString()}`
      }
    });

    setActiveWorkout({
      userID: currentUser.username,
      workoutID: `workout_${Date.now()}`,
      templateID: template.templateID,
      createdAt: new Date().toISOString(),
      exerciseList: template.exercises.map(exercise => ({  // Changed from exercises to exerciseList
        ...exercise,
        exerciseID: exercise.exerciseID,
        sets: Array(exercise.sets || 1).fill().map(() => ({
          values: {
            reps: null,
            weight: null,
            distance: null,
            time: null
          },
          status: 'pending'
        })),
        previousStats: previousWorkouts.flatMap(workout => 
          workout.exerciseList?.find(e => e.exerciseID === exercise.exerciseID)?.sets || []
        )
      })),
      previousWorkouts: previousWorkouts.map(workout => ({
        ...workout,
        exerciseList: workout.exerciseList || workout.exercises || []
      }))
    });
  } catch (err) {
    console.error("Workout initialization failed:", err);
    alert("Failed to load previous workouts");
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

const updateSetValue = (exerciseIndex, setIndex, field, value) => {
  const updatedExercises = [...activeWorkout.exerciseList];
  updatedExercises[exerciseIndex].sets[setIndex].values[field] = 
    value === '' ? null : Number(value);
  setActiveWorkout({ ...activeWorkout, exerciseList: updatedExercises });
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
  <div className="app">
    {/* Header Section */}
    <header className="app-header">
      <h1>I WANT ABS 🏋️</h1>
      {user && (
        <button onClick={signOut} className="sign-out-button">
          Sign Out
        </button>
      )}
    </header>

    {/* Template Creation Interface */}
    <div className="workout-creator">
      <h2>Create Workout Template</h2>
      <input
        type="text"
        placeholder="Workout Name"
        value={currentTemplate.name}
        onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
      />

      {currentTemplate.exercises.map((exercise, index) => (
        <div key={index} className="exercise-block">
          <input
            placeholder="Exercise Name"
            value={exercise.name}
            onChange={(e) => {
              const exercises = [...currentTemplate.exercises];
              exercises[index] = {
                ...exercises[index],
                name: e.target.value,
                exerciseID: exercise.exerciseID || `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              };
              setCurrentTemplate({ ...currentTemplate, exercises });
            }}
          />
          <input
            type="number"
            placeholder="Sets"
            min="1"
            value={exercise.sets}
            onChange={(e) => {
              const exercises = [...currentTemplate.exercises];
              exercises[index].sets = Math.max(1, parseInt(e.target.value) || 1);
              setCurrentTemplate({ ...currentTemplate, exercises });
            }}
          />
          <select
            value={exercise.measurementType}
            onChange={(e) => {
              const exercises = [...currentTemplate.exercises];
              exercises[index].measurementType = e.target.value;
              setCurrentTemplate({ ...currentTemplate, exercises });
            }}
          >
            <option value="weights">Weight x Sets x Reps</option>
            <option value="cardio">Distance</option>
            <option value="timed">Time</option>
          </select>
          <button
            onClick={() => {
              const exercises = currentTemplate.exercises.filter((_, i) => i !== index);
              setCurrentTemplate({ ...currentTemplate, exercises });
            }}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        onClick={() => setCurrentTemplate({
          ...currentTemplate,
          exercises: [...currentTemplate.exercises, { 
            name: '', 
            measurementType: 'weights',
            sets: 1
          }]
        })}
      >
        Add Exercise
      </button>
      
      <button onClick={createWorkoutTemplate}>
        Save Template
      </button>
    </div>

    {/* Active Workout Interface */}
    {activeWorkout && (
  <div className="workout-grid">
    {/* Column Headers */}
    <div className="column-header">Exercises</div>
    <div className="column-header">
      {activeWorkout.previousWorkouts?.[0] ? 
        new Date(activeWorkout.previousWorkouts[0].createdAt).toLocaleDateString() : 
        'Previous Workout'}
    </div>
    <div className="column-header">Current Workout</div>

    {/* Exercise Groups */}
    {activeWorkout.exerciseList.map((exercise, exIndex) => (
      <div key={`ex-group-${exIndex}`} className="exercise-group">
        {/* Exercise Name */}
        <div className="exercise-name-header">
          {exercise.name}
          <div style={{ fontSize: '0.8rem', color: '#666' }}>
            {exercise.measurementType === 'weights' ? 'Weight x Reps' : 
             exercise.measurementType === 'timed' ? 'Time' : 'Distance'}
          </div>
        </div>

        {/* Previous Workout Sets */}
        <div className="set-rows">
          {activeWorkout.previousWorkouts?.[0]?.exerciseList
            ?.find(e => e.exerciseID === exercise.exerciseID)?.sets
            ?.map((set, setIndex) => (
              <div key={`prev-set-${setIndex}`} className="set-row">
                <div className="set-cell">
                  <span className={`status-indicator ${set.status || 'pending'}`} />
                </div>
                <div className="set-cell">
                  {exercise.measurementType === 'weights' && (
                    <span>{set.values.weight || '-'} lbs × {set.values.reps || '-'} reps</span>
                  )}
                  {exercise.measurementType === 'timed' && (
                    <span>{set.values.time || '-'}</span>
                  )}
                  {exercise.measurementType === 'cardio' && (
                    <span>{set.values.distance || '-'} mi</span>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Current Workout Sets */}
        <div className="set-rows">
          {exercise.sets.map((set, setIndex) => (
            <div key={`current-set-${setIndex}`} className="set-row">
              <div className="set-cell">
                <div 
                  className={`status-indicator ${set.status || 'pending'}`}
                  onClick={() => cycleSetStatus(exIndex, setIndex)}
                />
              </div>
              <div className="set-cell">
                {exercise.measurementType === 'weights' && (
                  <>
                    <input
                      type="number"
                      placeholder="Weight"
                      value={set.values.weight || ''}
                      onChange={(e) => updateSetValue(exIndex, setIndex, 'weight', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Reps"
                      value={set.values.reps || ''}
                      onChange={(e) => updateSetValue(exIndex, setIndex, 'reps', e.target.value)}
                      style={{ marginLeft: '0.5rem' }}
                    />
                  </>
                )}
                {exercise.measurementType === 'timed' && (
                  <input
                    type="text"
                    placeholder="Time"
                    value={set.values.time || ''}
                    onChange={(e) => updateSetValue(exIndex, setIndex, 'time', e.target.value)}
                  />
                )}
                {exercise.measurementType === 'cardio' && (
                  <input
                    type="number"
                    placeholder="Distance"
                    step="0.1"
                    value={set.values.distance || ''}
                    onChange={(e) => updateSetValue(exIndex, setIndex, 'distance', e.target.value)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}

    {/* Finish Workout Button */}
    <div style={{ gridColumn: '1 / -1', padding: '1rem', textAlign: 'right', background: 'white' }}>
      <button onClick={saveWorkoutProgress}>
        Finish Workout
      </button>
    </div>
  </div>
)}

    {/* Workout History Section */}
    <div className="workout-history">
      <h2>Workout History</h2>
      {workoutHistory.map(workout => (
        <div key={workout.workoutID} className="workout-log">
          <div className="workout-header">
            <h3>{new Date(workout.createdAt).toLocaleDateString()}</h3>
            {workout.templateID && (
              <small>
                From template: {
                  workoutTemplates.find(t => t.templateID === workout.templateID)?.name
                }
              </small>
            )}
          </div>
          {workout.exercises?.map((exercise, exIndex) => (
            <div key={exIndex} className="exercise-history">
              <h5>{exercise.name}</h5>
              {exercise.sets?.map((set, setIndex) => (
                <div key={setIndex} className="set-history">
                  {set.values && Object.entries(set.values).map(([key, value]) => (
                    <span key={key}>{key}: {value ?? 'N/A'}</span>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>

    {/* Template List Section */}
    <div className="template-list">
      <h2>Your Workout Templates</h2>
      {workoutTemplates.map(template => (
        <div key={template.templateID} className="template-card">
          <h3>{template?.name || "Unnamed Template"}</h3>
          <button onClick={() => startWorkout(template)}>
            Start Workout
          </button>
          <p>Exercises: {(template?.exercises || []).length}</p>
        </div>
      ))}
    </div>
  </div>
);
}

export default withAuthenticator(App);