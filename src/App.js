import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import { FaHome, FaDumbbell, FaChartLine, FaUser } from 'react-icons/fa';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';

const API_BASE = 'https://4tb1rc24q2.execute-api.us-east-1.amazonaws.com/Prod';

function App({ signOut, user }) {
  // State Management Section
  // -------------------------
  // State Variables
  const [activeView, setActiveView] = useState('home');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [workoutTemplates, setWorkoutTemplates] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null); // MOVE THIS UP
  const [reps, setReps] = useState('');
  const [currentTemplate, setCurrentTemplate] = useState({
    name: '',
    exercises: [{
      name: '',
      measurementType: 'weights',
      sets: 1,
      previousStats: null
    }]
  });
  // ...rest of state declarations

// Swipe Handlers
const handleTouchStart = (e) => {
  if (activeWorkout) {
    setTouchStartY(e.touches[0].clientY);
  }
};

const handleTouchEnd = (e) => {
  if (!activeWorkout) return;
  
  const touchEndY = e.changedTouches[0].clientY;
  const deltaY = touchStartY - touchEndY;

  // Only trigger on vertical swipes
  if (Math.abs(deltaY) > 50 && !e.target.closest('input')) {
    if (deltaY > 0) { // Swipe down
      setCurrentExerciseIndex(prev => 
        Math.min(prev + 1, activeWorkout.exerciseList.length - 1)
      );
    } else { // Swipe up
      setCurrentExerciseIndex(prev => Math.max(prev - 1, 0));
    }
  }
};
  
  // Track workout history and loading states
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  

  // User Authentication & Data Loading Section
  // ------------------------------------------
  // In your user loading useEffect
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { tokens } = await fetchAuthSession();
        if (!tokens?.idToken?.payload?.sub) {
          throw new Error("No user ID in token");
        }
        
        setCurrentUser({
          username: tokens.idToken.payload.sub,
          email: tokens.idToken.payload.email
        });
        fetchWorkouts();
      } catch (err) {
        console.log("User not signed in", err);
        // Redirect to login if needed
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
      
      // Sort history by date descending
  const sortedHistory = (res.data.history || []).sort((a, b) => 
    new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
  );
  
      setWorkoutTemplates(res.data.templates || []);
      setWorkoutHistory(sortedHistory);
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
      const templateWithIDs = {
        ...currentTemplate,
        exercises: currentTemplate.exercises.map(ex => ({
          ...ex,
          exerciseID: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })),
        userID: currentUser.username
      };

      const response = await axios.post(`${API_BASE}/templates`, templateWithIDs, {
        headers: { Authorization: `Bearer ${tokens?.idToken?.toString()}` }
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
const startWorkout = async (template) => {
  try {
    // Fetch previous workouts using the CORRECTED lambda
    const { data: previousWorkouts = [] } = await axios.get(`${API_BASE}/history`, {
      params: { 
        templateID: template.templateID,
        limit: 2
      }
    });

    // Initialize activeWorkout with exerciseList
    setActiveWorkout({
      userID: currentUser.username,
      workoutID: `workout_${Date.now()}`,
      templateID: template.templateID,
      createdAt: new Date().toISOString(),
      exerciseList: template.exercises.map(exercise => ({
        ...exercise,
        exerciseID: exercise.exerciseID,
        sets: Array(exercise.sets).fill().map(() => ({
          values: { reps: null, weight: null, distance: null, time: null },
          status: 'pending'
        })),
        // Ensure previousStats are correctly mapped
        previousStats: previousWorkouts.flatMap(workout => 
          workout.exerciseList.find(e => e.exerciseID === exercise.exerciseID)?.sets || []
        )
      })),
      previousWorkouts: previousWorkouts
    });
  } catch (err) {
    console.error("Workout initialization failed:", err);
  }
};

const updateSetStatus = (exerciseIndex, setIndex, status) => {
  const updatedExercises = [...activeWorkout.exerciseList];
  updatedExercises[exerciseIndex].sets[setIndex].status = status;
  setActiveWorkout({ ...activeWorkout, exerciseList: updatedExercises });
};

const cycleSetStatus = (exerciseIndex, setIndex) => {
  const statuses = ['good', 'medium', 'bad'];
  const currentStatus = activeWorkout.exerciseList[exerciseIndex].sets[setIndex].status;
  const newStatus = statuses[(statuses.indexOf(currentStatus) + 1) % 3];
  updateSetStatus(exerciseIndex, setIndex, newStatus);
};

const formatTimeInput = (value) => {
  if (!value) return '';
  
  // Remove non-numeric characters except colon
  let cleaned = value.replace(/[^0-9:]/g, '');
  
  // Handle backspace/delete
  if (cleaned.length < value.length) return cleaned;

  // Auto-insert colon after 2 digits
  if (cleaned.length === 2 && !cleaned.includes(':')) {
    return cleaned + ':';
  }
  
  // If user types past 2 digits without colon, auto-format
  if (cleaned.length > 2 && !cleaned.includes(':')) {
    cleaned = cleaned.slice(0, 2) + ':' + cleaned.slice(2);
  }

  // Prevent more than 5 characters (00:00)
  return cleaned.substring(0, 5);
};

const validateTimeInput = (value) => {
  // Allow intermediate formats during typing
  return /^\d{0,2}:?\d{0,2}$/.test(value);
};

const updateSetValue = (exerciseIndex, setIndex, field, value) => {
  const updatedExercises = [...activeWorkout.exerciseList];
  
  // Special handling for time fields
  if (field === 'time') {
    updatedExercises[exerciseIndex].sets[setIndex].values[field] = value || null;
  } else {
    updatedExercises[exerciseIndex].sets[setIndex].values[field] = 
      value === '' ? null : Number(value);

    // Autofill logic for reps in first set
    if (field === 'reps' && setIndex === 0 && updatedExercises[exerciseIndex].measurementType === 'weights') {
      const newRepsValue = value === '' ? null : Number(value);
      for (let i = 1; i < updatedExercises[exerciseIndex].sets.length; i++) {
        if (updatedExercises[exerciseIndex].sets[i].values.reps === null) {
          updatedExercises[exerciseIndex].sets[i].values.reps = newRepsValue;
        }
      }
    }

    // NEW: Autofill logic for weight in first set
    if (field === 'weight' && setIndex === 0 && updatedExercises[exerciseIndex].measurementType === 'weights') {
      const baseWeight = value === '' ? null : Number(value);
      
      if (baseWeight !== null) {
        // Calculate +5 per subsequent set
        updatedExercises[exerciseIndex].sets.forEach((set, idx) => {
          if (idx > 0) {
            set.values.weight = baseWeight + (5 * idx);
          }
        });
      } else {
        // Clear subsequent weights if first is empty
        updatedExercises[exerciseIndex].sets.forEach((set, idx) => {
          if (idx > 0) set.values.weight = null;
        });
      }
    }
  }
  
  setActiveWorkout({ ...activeWorkout, exerciseList: updatedExercises });
};

// Add this function before the return statement
const renderSetValues = (measurementType, values) => {
  if (!values) return null;
  
  switch (measurementType) {
    case 'weights':
      return (
        <span>
          {values.weight || '-'} × {values.reps || '-'}
        </span>
      );
    case 'timed':
      return <span>{values.time || '-'}</span>;
    case 'cardio':
      return <span>{values.distance || '-'} mi</span>;
    default:
      return null;
  }
};

const saveWorkoutProgress = async () => {
  try {
    if (!activeWorkout) {
      alert('No active workout to save');
      return;
    }

    const { tokens } = await fetchAuthSession();
    
    // Transform the data to match your API's expected format
    const workoutData = {
      userID: currentUser.username,
      workoutID: activeWorkout.workoutID,
      templateID: activeWorkout.templateID,
      createdAt: activeWorkout.createdAt,
      completedAt: new Date().toISOString(),
      isTemplate: false,
      exerciseList: activeWorkout.exerciseList.map(exercise => ({
        name: exercise.name,
        exerciseID: exercise.exerciseID,
        measurementType: exercise.measurementType,
        sets: exercise.sets.map(set => ({
          values: {
            weight: set.values.weight ? Number(set.values.weight) : null,
            reps: set.values.reps ? Number(set.values.reps) : null,
            distance: set.values.distance ? Number(set.values.distance) : null,
            time: set.values.time || null
          },
          status: set.status || 'pending'
        }))
      })),
      // Only include if your API expects it
      ...(activeWorkout.previousWorkouts && { previousWorkouts: activeWorkout.previousWorkouts })
    };

    const response = await axios.post(API_BASE, workoutData, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens?.idToken?.toString()}`
      }
    });

    console.log('Workout saved successfully:', response.data);
    await fetchWorkouts(); // Refresh your workout list
    setActiveWorkout(null); // Close the active workout
    console.log("Active Workout Structure:", JSON.stringify(activeWorkout, null, 2));
    return response.data;
  } catch (err) {
    console.error("Save failed:", {
      error: err,
      message: err.message,
      response: err.response?.data
    });
    alert(`Failed to save workout: ${err.response?.data?.message || err.message}`);
    throw err;
  }
};

const calculateWorkoutDuration = (workout) => {
  if (!workout.createdAt || !workout.completedAt) return '--';
  const start = new Date(workout.createdAt);
  const end = new Date(workout.completedAt);
  return Math.round((end - start) / (1000 * 60)); // Returns minutes
};

const BottomNav = () => (
  <div className="bottom-nav">
    <button onClick={() => setActiveView('home')} className={activeView === 'home' ? 'active' : ''}>
      <FaHome />
    </button>
    <button onClick={() => setActiveView('build')} className={activeView === 'build' ? 'active' : ''}>
      <FaDumbbell />
    </button>
    <button onClick={() => setActiveView('stats')} className={activeView === 'stats' ? 'active' : ''}>
      <FaChartLine />
    </button>
    <button onClick={() => setActiveView('profile')} className={activeView === 'profile' ? 'active' : ''}>
      <FaUser />
    </button>
  </div>
);

const CalendarView = ({ workouts }) => {
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add fallback to createdAt if date field doesn't exist
  const normalizeWorkoutDate = (workout) => {
    return workout.date || workout.createdAt;
  };

  return (
    <div className="calendar-container">
      <div className="month-header">
        <button onClick={() => setSelectedMonth(prev => new Date(prev.setMonth(prev.getMonth() - 1)))}>
          ←
        </button>
        <h3>{format(selectedMonth, 'MMMM yyyy')}</h3>
        <button onClick={() => setSelectedMonth(prev => new Date(prev.setMonth(prev.getMonth() + 1)))}>
          →
        </button>
      </div>
      <div className="calendar-grid">
        {daysInMonth.map(day => {
          const hasWorkout = workouts.some(workout => {
            const workoutDate = normalizeWorkoutDate(workout);
            return (
              isSameMonth(new Date(workoutDate), selectedMonth) &&
              format(new Date(workoutDate), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
            );
          });
          
          return (
            <div key={day} className={`calendar-day ${!isSameMonth(day, selectedMonth) ? 'other-month' : ''}`}>
              {format(day, 'd')}
              {hasWorkout && <div className="workout-dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StatsView = ({ workoutHistory }) => {
  const totalWorkouts = workoutHistory.length;
  const totalMinutes = workoutHistory.reduce((sum, workout) => sum + calculateWorkoutDuration(workout), 0);
  
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <h3>Total Workouts</h3>
        <p>{totalWorkouts}</p>
      </div>
      <div className="stat-card">
        <h3>Total Minutes</h3>
        <p>{totalMinutes}</p>
      </div>
    </div>
  );
};

const ProfileView = ({ user }) => (
  <div className="profile-view">
    <h2>{user?.email}</h2>
    <p>Member since: {new Date(user?.signInUserSession.idToken.payload.auth_time * 1000).toLocaleDateString()}</p>
  </div>
);
// UI Components Section
// ----------------------
return (
  <div className="app">
    <header className="app-header">
      <h1>I WANT ABS 🏋️</h1>
    </header>

    <div className="main-content">
    {activeView === 'home' && (
  <>
    <div className="calendar-container">
      {loading ? (
        <div className="calendar-loading">Loading calendar...</div>
      ) : (
        <CalendarView workouts={workoutHistory} />
      )}
    </div>
        <div className="calendar-container">
          <CalendarView workouts={workoutHistory} />
        </div>
        
        <div className="workout-history">
          <h2 style={{ padding: '0 1rem' }}>Recent Workouts</h2>
          {workoutHistory.map(workout => (
            <div key={workout.workoutID} className="workout-log">
              {/* Existing workout history item rendering */}
            </div>
          ))}
        </div>
        
        <h2 style={{ padding: '0 1rem' }}>My Workout Templates</h2>
        <div className="template-list">
          {workoutTemplates.map(template => (
            <div key={template.templateID} className="template-card">
              {/* Existing template card rendering */}
            </div>
          ))}
        </div>
      </>
    )}

      {activeView === 'build' && (
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
                exercises[index] = {
                  ...exercises[index],
                  name: e.target.value,
                  exerciseID: exercise.exerciseID || `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                };
                setCurrentTemplate({ ...currentTemplate, exercises });
              }}
            />
            <select
              value={exercise.sets}
              onChange={(e) => {
                const exercises = [...currentTemplate.exercises];
                exercises[index].sets = parseInt(e.target.value);
                setCurrentTemplate({ ...currentTemplate, exercises });
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>
                  {num} Set{num !== 1 ? 's' : ''}
                </option>
              ))}
            </select>
            <select
              value={exercise.measurementType}
              onChange={(e) => {
                const exercises = [...currentTemplate.exercises];
                exercises[index].measurementType = e.target.value;
                setCurrentTemplate({ ...currentTemplate, exercises });
              }}
            >
              <option value="weights">Weight × Sets × Reps</option>
              <option value="bodyweight">Bodyweight (Reps)</option>
              <option value="timed">Time</option>
              <option value="cardio">Distance</option>
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

        <button
          onClick={() => setCurrentTemplate({
            ...currentTemplate,
            exercises: [...currentTemplate.exercises, { 
              name: '', 
              measurementType: 'weights',
              sets: 1
            }]
          })}
        >
          Add Exercise
        </button>
        
        <button onClick={createWorkoutTemplate}>
          Save Template
        </button>
      </div>
    )}
    {activeView === 'stats' && (
        <StatsView workoutHistory={workoutHistory} />
      )}

      {activeView === 'profile' && (
        <ProfileView user={user} />
      )}
      {/* Active Workout Interface */}
      {activeWorkout && (
    <div className="workout-grid" 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}  // Add this prop
        style={{ display: 'block' }}>
      {/* Navigation Dots */}
      <div className="exercise-nav-dots">
        {activeWorkout.exerciseList.map((_, index) => (
          <div 
            key={index}
            className={`nav-dot ${index === currentExerciseIndex ? 'active' : ''}`}
          />
        ))}
      </div>

    {/* Exercise Cards Container */}
    <div className="exercise-card-container">
    {activeWorkout.exerciseList.map((exercise, exIndex) => (
          <div 
            key={exIndex}
            className="exercise-card"
            style={{ 
              transform: `translateY(${(exIndex - currentExerciseIndex) * 100}%)`,
              opacity: exIndex === currentExerciseIndex ? 1 : 0.3,
              transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)'
            }}
          >
          {/* Exercise Header */}
          <div className="exercise-header-cell">
            {exercise.name}
            <div className="exercise-type">
              {exercise.measurementType === 'weights' ? 'Weight × Reps' : 
              exercise.measurementType === 'timed' ? 'Time' :
              exercise.measurementType === 'bodyweight' ? 'Reps' : 
              'Distance'}
            </div>
          </div>

          {/* Previous Workout Section */}
          <div className="previous-cell" data-label="Previous Workout">
            {exercise.previousStats?.map((set, setIndex) => (
              <div key={setIndex} className="set-data">
                <div className="previous-set">
                  <span className={`status-indicator ${set.status || 'pending'}`} />
                  {renderSetValues(exercise.measurementType, set.values)}
                </div>
              </div>
            ))}
          </div>

          {/* Current Workout Section */}
          <div className="current-cell" data-label="Current Workout">
            {exercise.sets.map((set, setIndex) => (
              <div key={setIndex} className="current-set">
                {/* Keep existing input fields and status indicators */}
                <div 
                  className={`status-indicator ${set.status}`}
                  onClick={() => cycleSetStatus(exIndex, setIndex)}
                />
                {exercise.measurementType === 'weights' && (
                  <div className="weight-reps">
                    <input
                      type="number"
                      placeholder="Wgt"
                      value={set.values.weight || ''}
                      onChange={(e) => updateSetValue(exIndex, setIndex, 'weight', e.target.value)}
                    />
                    <span>×</span>
                    <input
                      type="number"
                      placeholder="Reps"
                      value={set.values.reps || ''}
                      onChange={(e) => updateSetValue(exIndex, setIndex, 'reps', e.target.value)}
                    />
                  </div>
                )}
                {exercise.measurementType === 'bodyweight' && (
                  <div className="weight-reps">
                    <input
                      type="number"
                      placeholder="Reps"
                      value={exercise.sets[setIndex]?.values?.reps || ''}
                      onChange={(e) => updateSetValue(exIndex, setIndex, 'reps', e.target.value)}
                    />
                    {activeWorkout.previousWorkouts?.[0]?.exerciseList
                      ?.find(e => e.exerciseID === exercise.exerciseID)?.sets?.[setIndex]?.values?.reps && (
                      <p>Last: {activeWorkout.previousWorkouts[0].exerciseList
                        .find(e => e.exerciseID === exercise.exerciseID).sets[setIndex].values.reps} reps</p>
                    )}
                  </div>
                )}

                {exercise.measurementType === 'timed' && (
                  <div className="time-input">
                    <input
                      type="text"
                      placeholder="MM:SS"
                      value={set.values.time || ''}
                      onChange={(e) => {
                        const formatted = formatTimeInput(e.target.value);
                        if (validateTimeInput(formatted)) {
                          updateSetValue(exIndex, setIndex, 'time', formatted);
                        }
                      }}
                    />
                  </div>
                )}
                {exercise.measurementType === 'cardio' && (
                  <input
                    type="number"
                    placeholder="Miles"
                    value={set.values.distance || ''}
                    onChange={(e) => updateSetValue(exIndex, setIndex, 'distance', e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

    <div className="footer-cell">
      <button onClick={saveWorkoutProgress}>Finish Workout</button>
    </div>
  </div>
)}

    <BottomNav />
  </div>
);


    {/* Workout History Section */}
    <div className="workout-history">
      <h2>Workout History</h2>
      {workoutHistory.map(workout => (
        <div key={workout.workoutID} className="workout-log">
          <div className="workout-header">
            <h3>{new Date(workout.createdAt).toLocaleDateString()}</h3>
            {workout.templateID && (
              <small>
                From template: {
                  workoutTemplates.find(t => t.templateID === workout.templateID)?.name
                }
              </small>
            )}
          </div>
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