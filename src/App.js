import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE = 'https://4tb1rc24q2.execute-api.us-east-1.amazonaws.com/Prod';

function App() {
  const [workout, setWorkout] = useState({
    userID: 'user1',
    exerciseName: '',
    weight: '',
    reps: '',
    sets: '',
    notes: ''
  });

  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch workouts from API
  const fetchWorkouts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/`, {  // Note the trailing slash
        params: { userID: 'user1' }
      });
      setWorkouts(res.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Failed to load workouts");
    } finally {
      setLoading(false);
    }
  };

  // Submit new workout
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/`, workout);  // Note the trailing slash
      alert('Workout saved!');
      setWorkout({
        userID: 'user1',
        exerciseName: '',
        weight: '',
        reps: '',
        sets: '',
        notes: ''
      });
      fetchWorkouts(); // Refresh list
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save workout");
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
              placeholder="Weight"
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
                <p>Weight: {w.weight} lbs | Sets: {w.sets} | Reps: {w.reps}</p>
                {w.notes && <p className="notes">Notes: {w.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;