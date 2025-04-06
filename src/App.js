import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'https://4tb1rc24q2.execute-api.us-east-1.amazonaws.com/Prod';

function App() {
  const [workout, setWorkout] = useState({
    userID: 'user1',
    exerciseName: '',
    weight: '',
    reps: '',
    sets: '',
    notes: ''
  });

  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchWorkoutHistory();
  }, []);

  const fetchWorkoutHistory = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/GetWorkouts`, {
        params: { userID: 'user1' }
      });
      setWorkoutHistory(response.data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      alert('Failed to load workout history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/CreateWorkout`, workout);
      alert('Workout saved! 💪');
      setWorkout({
        userID: 'user1',
        exerciseName: '',
        weight: '',
        reps: '',
        sets: '',
        notes: ''
      });
      fetchWorkoutHistory();
    } catch (error) {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="app">
      <h1>I WANT ABS 🏋️</h1>
      
      {/* Workout Entry Form */}
      <div className="workout-form">
        <h2>New Workout</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Exercise Name"
            value={workout.exerciseName}
            onChange={(e) => setWorkout({...workout, exerciseName: e.target.value})}
            required
          />
          
          <div className="input-group">
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

          <textarea
            placeholder="Notes"
            value={workout.notes}
            onChange={(e) => setWorkout({...workout, notes: e.target.value})}
          />

          <button type="submit">Save Workout</button>
        </form>
      </div>

      {/* Workout History */}
      <div className="history-section">
        <h2>Workout History</h2>
        {isLoading ? (
          <p>Loading...</p>
        ) : workoutHistory.length === 0 ? (
          <p>No workouts recorded yet</p>
        ) : (
          <div className="history-grid">
            {workoutHistory.map((item) => (
              <div key={item.workoutID} className="workout-card">
                <h3>{item.exerciseName}</h3>
                <div className="workout-metrics">
                  {item.weight && <span>🏋️ {item.weight} lbs</span>}
                  {item.reps && <span>🔁 {item.reps} reps</span>}
                  {item.sets && <span>🔄 {item.sets} sets</span>}
                  {item.date && <span>📅 {new Date(item.date).toLocaleDateString()}</span>}
                </div>
                {item.notes && <p className="notes">📝 {item.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;