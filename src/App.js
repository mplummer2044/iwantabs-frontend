import { useState, useEffect } from 'react';
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
      exercises: template.exercises.map(exercise => ({
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
        // Changed structure here:
        previousStats: previousWorkouts.flatMap(workout => 
          workout.exerciseList?.find(e => e.exerciseID === exercise.exerciseID)?.sets || []
        )
      })),
      previousWorkouts: previousWorkouts.map(workout => ({
        ...workout,
        // Ensure consistent exerciseList structure
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
      exerciseList: activeWorkout.exercises.map(exercise => ({
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
          status: set.status
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

    {/* Template Creation Interface remains the same */}

    {/* Active Workout Interface */}
    {activeWorkout && (
      <div className="workout-grid">
        {/* Previous Workouts Column remains the same */}

        {/* Current Workout Column - UPDATED */}
        <div className="workout-column current">
          <h3>Current Workout</h3>
          {activeWorkout.exercises?.length > 0 ? (
            activeWorkout.exercises.map((exercise, exIndex) => (
              <div key={exIndex} className="exercise-column">
                <h4>{exercise.name}</h4>
                <div className="sets-container">
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="set-row">
                      {/* Status Indicator */}
                      <div 
                        className={`status-indicator ${set.status || 'pending'}`}
                        onClick={() => {
                          const statuses = ['good', 'medium', 'bad'];
                          const currentIndex = statuses.indexOf(set.status);
                          const nextStatus = statuses[(currentIndex + 1) % 3];
                          updateSetStatus(exIndex, setIndex, nextStatus);
                        }}
                      />
                      
                      {/* Conditional Input Fields */}
                      {exercise.measurementType === 'weights' && (
                        <>
                          <input
                            type="number"
                            placeholder="Weight (lbs)"
                            value={set.values.weight || ''}
                            onChange={(e) => updateSetValue(exIndex, setIndex, 'weight', e.target.value)}
                          />
                          <input
                            type="number"
                            placeholder="Reps"
                            value={set.values.reps || ''}
                            onChange={(e) => updateSetValue(exIndex, setIndex, 'reps', e.target.value)}
                          />
                        </>
                      )}
                      
                      {exercise.measurementType === 'timed' && (
                        <input
                          type="text"
                          placeholder="Time (e.g., 5:30)"
                          value={set.values.time || ''}
                          onChange={(e) => updateSetValue(exIndex, setIndex, 'time', e.target.value)}
                        />
                      )}
                      
                      {exercise.measurementType === 'cardio' && (
                        <input
                          type="number"
                          placeholder="Distance (miles)"
                          step="0.1"
                          value={set.values.distance || ''}
                          onChange={(e) => updateSetValue(exIndex, setIndex, 'distance', e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p>No exercises in this workout</p>
          )}
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