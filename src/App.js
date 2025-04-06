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

  // Fetch workout history
  const fetchWorkoutHistory = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL, {
        params: {
          userID: 'user1'
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setWorkoutHistory(response.data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit new workout
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, workout, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      alert('Workout saved! 💪');
      setWorkout({
        userID: 'user1',
        exerciseName: '',
        weight: '',
        reps: '',
        sets: '',
        notes: ''
      });
      fetchWorkoutHistory(); // Refresh history
    } catch (error) {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  // Load history on component mount
  useEffect(() => {
    fetchWorkoutHistory();
  }, []);

  return (
    <div className="app">
      {/* ... (keep your existing JSX) ... */}
    </div>
  );
}

export default App;