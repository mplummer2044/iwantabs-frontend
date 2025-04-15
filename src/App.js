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

    // Safely initialize workout with fallbacks
    setActiveWorkout({
      userID: currentUser?.username || '',
      workoutID: `workout_${Date.now()}`,
      templateID: template.templateID || '',
      createdAt: new Date().toISOString(),
      exercises: (template.exercises || []).map(exercise => ({
        name: exercise.name || 'Unnamed Exercise',
        exerciseID: exercise.exerciseID || `ex_${Date.now()}`,
        measurementType: exercise.measurementType || 'weights',
        sets: Array(Math.max(1, exercise.sets || 1)).fill().map(() => ({
          values: {
            reps: null,
            weight: null,
            distance: null,
            time: null
          },
          status: 'pending'
        })),
        previousStats: previousWorkouts.map(workout => ({
          date: workout.createdAt,
          sets: (workout.exercises || []).find(e => 
            e.exerciseID === exercise.exerciseID
          )?.sets || null
        }))
      })),
      previousWorkouts
    });
  } catch (err) {
    console.error("Workout initialization failed:", err);
    alert("Failed to load workout template. Please try again.");
  }
};

const updateSetStatus = (exerciseIndex, setIndex, status) => {
  try {
    if (!activeWorkout || !activeWorkout.exercises) return;
    
    const updatedExercises = [...activeWorkout.exercises];
    if (!updatedExercises[exerciseIndex]?.sets?.[setIndex]) return;
    
    updatedExercises[exerciseIndex].sets[setIndex].status = status;
    setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
  } catch (err) {
    console.error("Failed to update set status:", err);
  }
};

const saveWorkoutProgress = async () => {
  try {
    if (!activeWorkout) return;
    
    const { tokens } = await fetchAuthSession();
    const workoutData = {
      ...activeWorkout,
      completedAt: new Date().toISOString(),
      improvements: activeWorkout.exercises.map(exercise => {
        const lastWorkout = activeWorkout.previousWorkouts?.[0];
        if (!lastWorkout) return null;

        const lastExercise = (lastWorkout.exercises || []).find(
          e => e.exerciseID === exercise.exerciseID
        );

        if (!lastExercise) return null;

        return {
          exerciseID: exercise.exerciseID,
          improved: exercise.sets.some((set, i) => {
            const lastSet = lastExercise.sets?.[i];
            if (!lastSet?.values) return false;
            
            const currentWeight = Number(set.values?.weight || 0);
            const lastWeight = Number(lastSet.values.weight || 0);
            const currentReps = Number(set.values?.reps || 0);
            const lastReps = Number(lastSet.values.reps || 0);
            
            return currentWeight > lastWeight || currentReps > lastReps;
          })
        };
      })
    };

    // Save to API
    const response = await axios.post(API_BASE, workoutData, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens?.idToken?.toString()}`
      }
    });

    // Refresh data
    await fetchWorkouts();
    setActiveWorkout(null);
    
    return response.data;
  } catch (err) {
    console.error("Save failed:", {
      error: err,
      message: err.message,
      response: err.response?.data
    });
    alert(`Failed to save workout: ${err.response?.data?.message || err.message}`);
    throw err; // Re-throw if you want to handle this error further up the chain
  }
};
  // UI Components Section
  // ----------------------
  return (
    <div className="app">
      {/* Header Section */}
      <header className="app-header">
        <h1>I WANT ABS 🏋️</h1>
        {user && <button onClick={signOut} className="sign-out-button">Sign Out</button>}
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
                // Preserve exerciseID if exists
                exerciseID: exercise.exerciseID || `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              };
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
        
        <button onClick={() => setCurrentTemplate({
          ...currentTemplate,
          exercises: [...currentTemplate.exercises, { 
            name: '', 
            measurementType: 'weights',
            sets: 1
          }]
        })}>
          Add Exercise
        </button>
        
        <button onClick={createWorkoutTemplate}>Save Template</button>
      </div>

      {/* Active Workout Interface */}
      {activeWorkout && (
      <div className="workout-grid">
        {/* Previous Workouts Column - Now shows last 2 workouts */}
        <div className="workout-column previous">
          <h3>Previous Workouts</h3>
          {activeWorkout.previousWorkouts?.map((workout, workoutIndex) => (
            <div key={workoutIndex} className="previous-workout">
              <h4 className="workout-date">
                {new Date(workout.createdAt).toLocaleDateString()} - Performance
              </h4>
              {workout.exercises?.map((exercise, exIndex) => (
                <div key={exIndex} className="exercise-column">
                  <h5>{exercise.name}</h5>
                  {exercise.sets?.map((set, setIndex) => (
                    <div key={setIndex} className="set-row">
                      {Object.entries(set.values || {}).map(([key, value]) => (
                        value && <span key={key}>{key}: {value}</span>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
          {!activeWorkout.previousWorkouts?.length && (
            <p>No previous workouts found</p>
          )}
        </div>

          {/* Current Workout Column */}
          <div className="workout-column current">
            <h3>Current Workout</h3>
            {activeWorkout.exercises?.map((exercise, exIndex) => (
              <div key={exIndex} className="exercise-column">
                <h4>{exercise.name}</h4>
                {exercise.sets?.map((set, setIndex) => (
                  <div
                    key={setIndex}
                    className={`set-row ${set.status}`}
                    onClick={() => {
                      const statuses = ['good', 'medium', 'bad'];
                      const currentIndex = statuses.indexOf(set.status);
                      const nextStatus = statuses[(currentIndex + 1) % 3];
                      updateSetStatus(exIndex, setIndex, nextStatus);
                    }}
                  >
                    <div className="status-indicator" />
                    {exercise.measurementType === 'weights' && (
                      <>
                        <input 
                          type="number" 
                          placeholder="Weight"
                          value={set.values.weight || ''}
                          onChange={(e) => {
                            const updatedExercises = [...activeWorkout.exercises];
                            const newValue = parseFloat(e.target.value) || null;
                            updatedExercises[exIndex].sets[setIndex].values.weight = newValue;
                            setActiveWorkout({...activeWorkout, exercises: updatedExercises});
                          }}
                        />
                        <input 
                          type="number" 
                          placeholder="Reps"
                          value={set.values.reps || ''}
                          onChange={(e) => {
                            const updatedExercises = [...activeWorkout.exercises];
                            const newValue = parseInt(e.target.value) || null;
                            updatedExercises[exIndex].sets[setIndex].values.reps = newValue;
                            setActiveWorkout({...activeWorkout, exercises: updatedExercises});
                          }}
                        />
                      </>
                    )}
                    {exercise.measurementType === 'cardio' && (
                      <input 
                        type="number" 
                        placeholder="Distance (miles)"
                        value={set.values.distance || ''}
                        onChange={(e) => {
                          const updatedExercises = [...activeWorkout.exercises];
                          const newValue = parseFloat(e.target.value) || null;
                          updatedExercises[exIndex].sets[setIndex].values.distance = newValue;
                          setActiveWorkout({...activeWorkout, exercises: updatedExercises});
                        }}
                      />
                    )}
                    {exercise.measurementType === 'timed' && (
                      <input 
                        type="text" 
                        placeholder="Time (MM:SS)"
                        value={set.values.time || ''}
                        onChange={(e) => {
                          const updatedExercises = [...activeWorkout.exercises];
                          updatedExercises[exIndex].sets[setIndex].values.time = e.target.value;
                          setActiveWorkout({...activeWorkout, exercises: updatedExercises});
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
            <button onClick={saveWorkoutProgress}>Finish Workout</button>
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
            {/* Use template.name with safety checks */}
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