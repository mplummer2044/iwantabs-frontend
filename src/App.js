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
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { tokens } = await fetchAuthSession();
        setCurrentUser({
          username: tokens?.idToken?.payload.sub,
          email: tokens?.idToken?.payload.email
        });
        fetchWorkouts();
      } catch (err) {
        console.log("User not signed in", err);
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
      
      setWorkoutTemplates(res.data.templates || []);
      setWorkoutHistory(res.data.history || []);
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
      const response = await axios.post(`${API_BASE}/templates`, {
        ...currentTemplate,
        userID: currentUser.username
      }, {
        headers: {
          Authorization: `Bearer ${tokens?.idToken?.toString()}`
        }
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
  const startWorkout = (template) => {
    setActiveWorkout({
      // ... other fields
      exercises: (template.exercises || []).map(ex => ({
        ...ex,
        sets: Array(ex.sets || 1).fill().map(() => ({
          values: {
            weight: null,
            reps: null,
            distance: null,
            time: null
          },
          status: 'pending'
        })),
        previousStats: ex.previousStats || null
      })),
    });
  };

  const updateSetStatus = (exerciseIndex, setIndex, status) => {
    const updatedExercises = [...activeWorkout.exercises];
    updatedExercises[exerciseIndex].sets[setIndex].status = status;
    setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
  };

  const saveWorkoutProgress = async () => {
    try {
      const { tokens } = await fetchAuthSession();
      
      // Convert exercise data to DynamoDB-compatible format
      const workoutData = {
        userID: activeWorkout.userID,
        workoutID: activeWorkout.workoutID,
        createdAt: new Date().toISOString(),
        templateID: activeWorkout.templateID,
        isTemplate: false,
        exerciseList: activeWorkout.exercises.map(exercise => ({
          name: exercise.name,
          measurementType: exercise.measurementType,
          sets: exercise.sets.map(set => ({
            values: set.values,
            status: set.status
          })),
          previousStats: exercise.previousStats
        }))
      };
  
      console.log('Saving workout:', workoutData);
      
      const response = await axios.post(API_BASE, workoutData, {
        headers: {
          Authorization: `Bearer ${tokens?.idToken?.toString()}`
        }
      });
  
      console.log('Workout saved:', response.data);
      setActiveWorkout(null);
      fetchWorkouts();
    } catch (err) {
      console.error("Save failed:", {
        error: err.response?.data || err.message,
        config: err.config
      });
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
                exercises[index].name = e.target.value;
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
          <div className="workout-column previous">
            <h3>Last Performance</h3>
            {activeWorkout.exercises?.map((exercise, exIndex) => (
              <div key={exIndex} className="exercise-column">
                <h4>{exercise.name}</h4>
                {exercise.sets?.map((set, setIndex) => (
                  <div key={setIndex} className="set-row">
                    {set.values && Object.entries(set.values).map(([key, value]) => (
                      <span key={key}>{key}: {value ?? 'N/A'}</span>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>

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
            <h4>{new Date(workout.createdAt).toLocaleDateString()}</h4>
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