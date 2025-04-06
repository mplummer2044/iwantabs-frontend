import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://4tb1rc24q2.execute-api.us-east-1.amazonaws.com/Prod';

function App() {
  const [workout, setWorkout] = useState({
    userID: 'user1', // Replace with authenticated user later
    exerciseName: '',
    weight: '',
    reps: '',
    sets: '',
    notes: ''
  });

  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch workout history on component mount
  useEffect(() => {
    fetchWorkoutHistory();
  }, []);

  const fetchWorkoutHistory = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/GetWorkouts`, {
        params: { userID: 'user1' } // Same userID as above
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
      setWorkout({...workout, exerciseName: '', weight: '', reps: '', sets: '', notes: ''});
      // Refresh history after new submission
      fetchWorkoutHistory();
    } catch (error) {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="app">
      <h1>I WANT ABS 🏋️</h1>
      
      {/* Workout Form (existing code) */}
      <form onSubmit={handleSubmit}>
        {/* ... your existing form inputs ... */}
      </form>

      {/* Workout History Section */}
      <div className="history-section">
        <h2>Your Workout History</h2>
        
        {isLoading ? (
          <p>Loading history...</p>
        ) : workoutHistory.length === 0 ? (
          <p>No workouts recorded yet</p>
        ) : (
          <div className="history-grid">
            {workoutHistory.map((item) => (
              <div key={`${item.workoutID}-${item.date}`} className="workout-card">
                <h3>{item.exerciseName}</h3>
                <div className="workout-stats">
                  <span>📅 {new Date(item.date).toLocaleDateString()}</span>
                  {item.weight && <span>🏋️ {item.weight} lbs</span>}
                  {item.reps && <span>🔁 {item.reps} reps</span>}
                  {item.sets && <span>🔄 {item.sets} sets</span>}
                  {item.distance && <span>🏃 {item.distance} miles</span>}
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