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

  const fetchWorkouts = async () => {
    if (!currentUser?.username) return;
    
    setLoading(true);
    try {
      const { tokens } = await fetchAuthSession();
      const res = await axios.get(`${API_BASE}/workouts`, {
        headers: {
          Authorization: `Bearer ${tokens?.idToken?.toString()}`
        },
        params: { userID: currentUser.username }
      });
      setWorkoutTemplates(res.data.templates || []);
      setWorkoutHistory(res.data.history || []);
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Failed to load workouts");
    } finally {
      setLoading(false);
    }
  };

  const createWorkoutTemplate = async () => {
    try {
      const { tokens } = await fetchAuthSession();
      await axios.post(`${API_BASE}/templates`, currentTemplate, {
        headers: {
          Authorization: `Bearer ${tokens?.idToken?.toString()}`
        }
      });
      fetchWorkouts();
      setCurrentTemplate({ name: '', exercises: [] });
    } catch (err) {
      console.error("Template creation failed:", err);
    }
  };

  const startWorkout = (template) => {
    const previousWorkout = workoutHistory.find(w => w.templateId === template.id);
    setActiveWorkout({
      ...template,
      startTime: new Date().toISOString(),
      exercises: template.exercises.map(exercise => ({
        ...exercise,
        sets: Array(exercise.sets).fill().map((_, i) => ({
          setNumber: i + 1,
          status: 'pending',
          values: previousWorkout?.exercises[i]?.values || {}
        }))
      }))
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
      await axios.post(`${API_BASE}/workouts`, activeWorkout, {
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

      {/* Workout Templates List */}
      <div className="template-list">
        <h2>Your Workout Templates</h2>
        {workoutTemplates.map(template => (
          <div key={template.id} className="template-card">
            <h3>{template.name}</h3>
            <button onClick={() => startWorkout(template)}>Start Workout</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default withAuthenticator(App);