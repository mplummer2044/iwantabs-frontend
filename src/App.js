import { useState, useEffect } from 'react';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';

const API_BASE = 'https://4tb1rc24q2.execute-api.us-east-1.amazonaws.com/Prod';

function App({ signOut, user }) {
  const [workout, setWorkout] = useState({
    exerciseName: '',
    weight: '',
    reps: '',
    sets: '',
    distance: '',
    notes: ''
  });

  const [workouts, setWorkouts] = useState([]);
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
      const res = await axios.get(`${API_BASE}/`, {
        headers: {
          Authorization: `Bearer ${tokens?.idToken?.toString()}`,
          'Content-Type': 'application/json'
        },
        params: {
          userID: currentUser.username
        }
      });
      setWorkouts(res.data || []);
    } catch (err) {
      console.error("Fetch error:", err.response?.data || err.message);
      alert("Failed to load workouts");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser?.username) {
      alert("Please sign in to save workouts");
      return;
    }

    const payload = {
      userID: currentUser.username,
      workoutID: Date.now().toString(),
      exerciseName: workout.exerciseName || '',
      date: new Date().toISOString(),
      weight: workout.weight ? Number(workout.weight) : 0,
      reps: workout.reps ? Number(workout.reps) : 0,
      sets: workout.sets ? Number(workout.sets) : 0,
      distance: workout.distance ? Number(workout.distance) : 0,
      notes: workout.notes || ''
    };

    try {
      const { tokens } = await fetchAuthSession();
      await axios.post(`${API_BASE}/`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.idToken?.toString()}`
        }
      });
      
      alert('Workout saved successfully!');
      setWorkout({
        exerciseName: '',
        weight: '',
        reps: '',
        sets: '',
        distance: '',
        notes: ''
      });
      fetchWorkouts();
    } catch (err) {
      console.error("Save failed:", {
        sentData: payload,
        error: err.response?.data || err.message
      });
      alert(`Save failed: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>I WANT ABS 🏋️</h1>
        {user && (
          <button onClick={signOut} className="sign-out-button">
            Sign Out
          </button>
        )}
      </header>
      
      {/* Workout Form */}
      <div className="workout-form">
        <h2>Log New Workout</h2>
        {currentUser ? (
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Exercise name"
              value={workout.exerciseName}
              onChange={(e) => setWorkout({...workout, exerciseName: e.target.value})}
              required
            />
            
            <div className="input-grid">
              <input
                type="number"
                placeholder="Weight (lbs)"
                value={workout.weight}
                onChange={(e) => setWorkout({...workout, weight: e.target.value})}
              />
              <input
                type="number"
                placeholder="Reps"
                value={workout.reps}
                onChange={(e) => setWorkout({...workout, reps: e.target.value})}
              />
              <input
                type="number"
                placeholder="Sets"
                value={workout.sets}
                onChange={(e) => setWorkout({...workout, sets: e.target.value})}
              />
            </div>
  
            <div className="input-row">
              <input
                type="number"
                placeholder="Distance (miles)"
                value={workout.distance}
                onChange={(e) => setWorkout({...workout, distance: e.target.value})}
              />
            </div>
  
            <textarea
              placeholder="Notes"
              value={workout.notes}
              onChange={(e) => setWorkout({...workout, notes: e.target.value})}
            />
  
            <button type="submit">Save Workout</button>
          </form>
        ) : (
          <p>Please sign in to log workouts</p>
        )}
      </div>
  
      {/* Workout History */}
      <div className="workout-history">
        <h2>Your Workouts</h2>
        {loading ? (
          <p>Loading...</p>
        ) : workouts.length === 0 ? (
          <p>{currentUser ? "No workouts yet" : "Sign in to view your workouts"}</p>
        ) : (
          <div className="workout-grid">
            {workouts.map((w) => (
              <div key={w.workoutID} className="workout-card">
                <h3>{w.exerciseName}</h3>
                <div className="workout-stats">
                  {w.weight > 0 && <span>🏋️ {w.weight} lbs</span>}
                  {w.reps > 0 && <span>🔁 {w.reps} reps</span>}
                  {w.sets > 0 && <span>🔄 {w.sets} sets</span>}
                  {w.distance > 0 && <span>🏃 {w.distance} miles</span>}
                  {w.date && <span>📅 {new Date(w.date).toLocaleDateString()}</span>}
                </div>
                {w.notes && <p className="notes">📝 {w.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuthenticator(App);