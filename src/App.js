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

  // Keep your existing return JSX exactly the same
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
            {/* ... keep all your existing form JSX ... */}
          </form>
        ) : (
          <p>Please sign in to log workouts</p>
        )}
      </div>

      {/* Workout History */}
      <div className="workout-history">
        {/* ... keep your existing history JSX ... */}
      </div>
    </div>
  );
}

export default withAuthenticator(App);