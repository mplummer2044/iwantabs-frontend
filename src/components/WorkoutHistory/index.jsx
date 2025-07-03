import React from 'react';
import { useWorkout } from '../common/WorkoutContext';

const WorkoutHistory = () => {
  const { state } = useWorkout();
  const { workoutHistory } = state;

  const calculateDuration = (workout) => {
    if (!workout.createdAt || !workout.completedAt) return '--';
    const start = new Date(workout.createdAt);
    const end = new Date(workout.completedAt);
    const minutes = Math.round((end - start) / (1000 * 60));
    return minutes;
  };

  return (
    <div className="workout-history">
      <h2>Workout History</h2>
      {workoutHistory && workoutHistory.length > 0 ? (
        workoutHistory.map((workout, idx) => {
          const duration = calculateDuration(workout);
          const totalSets = Array.isArray(workout.exerciseList)
            ? workout.exerciseList.reduce((sum, ex) =>
                sum + (Array.isArray(ex.sets) ? ex.sets.length : 0), 0)
            : 0;
          return (
            <div key={idx} className="history-item">
              <h3>{workout.name || 'Workout'}</h3>
              <p>Duration: {duration} min</p>
              <p>Total Sets: {totalSets}</p>
            </div>
          );
        })
      ) : (
        <p>No completed workouts yet.</p>
      )}
    </div>
  );
};

export default WorkoutHistory;
