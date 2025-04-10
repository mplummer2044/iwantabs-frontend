import { useState, useEffect } from 'react';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';

const API_BASE = 'https://4tb1rc24q2.execute-api.us-east-1.amazonaws.com/Prod';

function App({ signOut, user }) {
  const [workoutTemplates, setWorkoutTemplates] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [currentTemplate, setCurrentTemplate] = useState({
    name: '',
    exercises: [{
      name: '',
      measurementType: 'weights',
      sets: 1,
      previousStats: null
    }]
  });
  
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

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

  // Add this new useEffect to handle user updates
useEffect(() => {
  if (currentUser?.username) {
    fetchWorkouts();
  }
}, [currentUser]); // Add currentUser as dependency

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
    
    // Set both templates and history from the response
    setWorkoutTemplates(res.data.templates || res.data.items || []);
    setWorkoutHistory(res.data.history || []);
  } catch (err) {
    console.error("Fetch error:", err.response?.data || err.message);
  } finally {
    setLoading(false);
  }
};


const createWorkoutTemplate = async () => {
  try {
    const { tokens } = await fetchAuthSession();
    const response = await axios.post(`${API_BASE}/templates`, {
      ...currentTemplate,
      userID: currentUser.username // Include user ID in payload
    }, {
      headers: {
        Authorization: `Bearer ${tokens?.idToken?.toString()}`
      }
    });
    
    // Update state with the returned template
    setWorkoutTemplates(prev => [...prev, response.data]);
    setCurrentTemplate({ 
      name: '', 
      exercises: [{  // Reset to initial state
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

const startWorkout = (template) => {
  const workoutId = `log_${Date.now()}`;
  
  setActiveWorkout({
    userID: currentUser.username,
    workoutID: workoutId,
    isTemplate: false,
    templateID: template.templateID, // Ensure this uses templateID
    exercises: (template.exercises || []).map(ex => ({ // Add safety check
      ...ex,
      sets: Array(ex.sets || 1).fill().map(() => ({ // Ensure sets array exists
        reps: null,
        weight: null,
        status: 'pending'
      })),
      actualReps: null,
      actualWeight: null
    }))
  });
};

// In template display:
<div className="template-list">
  {workoutTemplates.map(template => (
    <div key={template.templateID} className="template-card">
      <h3>{template.name || "Unnamed Template"}</h3> {/* Changed from templateName */}
      <button onClick={() => startWorkout(template)}>
        Start Workout
      </button>
      <p>Exercises: {(template.exercises || []).length}</p>
    </div>
  ))}
</div>

  const updateSetStatus = (exerciseIndex, setIndex, status) => {
    const updatedExercises = [...activeWorkout.exercises];
    updatedExercises[exerciseIndex].sets[setIndex].status = status;
    setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
  };

  const saveWorkoutProgress = async () => {
    try {
      const { tokens } = await fetchAuthSession();
      await axios.post(`${API_BASE}/`, activeWorkout, {
        headers: {
          Authorization: `Bearer ${tokens?.idToken?.toString()}`
        }
      });
      setActiveWorkout(null);
      fetchWorkouts();
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>I WANT ABS 🏋️</h1>
        {user && <button onClick={signOut} className="sign-out-button">Sign Out</button>}
      </header>

      {/* Workout Template Creation */}
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
          exercises: [...currentTemplate.exercises, { name: '', measurementType: 'weights' }]
        })}>
          Add Exercise
        </button>
        
        <button onClick={createWorkoutTemplate}>Save Template</button>
      </div>

      {/* Active Workout Grid */}
      {activeWorkout && (
        <div className="workout-grid">
          <div className="workout-column previous">
            <h3>Last Performance</h3>
            {activeWorkout.exercises.map((exercise, exIndex) => (
              <div key={exIndex} className="exercise-column">
                <h4>{exercise.name}</h4>
                {exercise.sets.map((set, setIndex) => (
                  <div key={setIndex} className="set-row">
                    {Object.entries(set.values).map(([key, value]) => (
                      <span key={key}>{key}: {value}</span>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>

          

          <div className="workout-column current">
            <h3>Current Workout</h3>
            {activeWorkout.exercises.map((exercise, exIndex) => (
              <div key={exIndex} className="exercise-column">
                <h4>{exercise.name}</h4>
                {exercise.sets.map((set, setIndex) => (
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
                        <input type="number" placeholder="Weight" />
                        <input type="number" placeholder="Reps" />
                      </>
                    )}
                    {exercise.measurementType === 'cardio' && (
                      <input type="number" placeholder="Distance (miles)" />
                    )}
                    {exercise.measurementType === 'timed' && (
                      <input type="text" placeholder="Time (MM:SS)" />
                    )}
                  </div>
                ))}
              </div>
            ))}
            <button onClick={saveWorkoutProgress}>Finish Workout</button>
          </div>
        </div>
      )}

{workoutHistory.map(workout => (
  <div key={workout.workoutID}>
    <h4>{new Date(workout.date).toLocaleDateString()}</h4>
    <p>Exercise: {workout.exerciseName}</p>
    {workout.templateID && (
      <small>
        From template: {
          workoutTemplates.find(t => t.templateID === workout.templateID)?.name
        }
      </small>
    )}
  </div>
))}

<div className="template-list">
  <h2>Your Workout Templates</h2>
  {workoutTemplates.map(template => (
    <div key={template.templateID} className="template-card">
      <h3>{template.templateName || "Unnamed Template"}</h3>
      <button onClick={() => startWorkout(template)}>
        Start Workout
      </button>
      <p>Exercises: {(template.exercises || []).length}</p>
    </div>
  ))}
</div>
    </div>
  );
}

export default withAuthenticator(App);