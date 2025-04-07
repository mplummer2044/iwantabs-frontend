import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE = 'https://4tb1rc24q2.execute-api.us-east-1.amazonaws.com/Prod';

function App() {
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

  // Fetch workouts from API
  const fetchWorkouts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/`, {
        params: { userID: 'user1' },
        headers: {
          'Content-Type': 'application/json'
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

  // Submit new workout
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prepare payload matching Lambda requirements exactly
    const payload = {
      userID: 'user1',
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
      const response = await axios.post(`${API_BASE}/`, payload, {
        headers: {
          'Content-Type': 'application/json'
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

  // Load initial data
  useEffect(() => {
    fetchWorkouts();
  }, []);

  return (
    <div className="app">
      <h1>I WANT ABS 🏋️</h1>
      
      {/* Workout Form */}
      <div className="workout-form">
        <h2>Log New Workout</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Exercise name"
            value={workout.exerciseName}
            onChange={(e) => setWorkout({...workout, exerciseName: e.target.value})}
            required
          />
          
          <div className="input-row">
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
      </div>

      {/* Workout History */}
      <div className="workout-history">
        <h2>Your Workouts</h2>
        {loading ? (
          <p>Loading...</p>
        ) : workouts.length === 0 ? (
          <p>No workouts yet</p>
        ) : (
          <div className="workout-list">
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

export default App;