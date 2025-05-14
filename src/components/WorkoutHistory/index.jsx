// src/components/WorkoutHistory/index.jsx
import React from 'react';
import { useWorkout } from '../common/WorkoutContext';

const WorkoutHistory = () => {
  const { state } = useWorkout();
  const { workoutHistory } = state;

  return (
    <div>
      <h2>Workout History</h2>
      {workoutHistory.map((workout, index) => (
        <div key={index}>
          <h3>{workout.name}</h3>
          {workout.exercises.map((exercise, exIndex) => (
            <div key={exIndex}>
              <p>{exercise.name}</p>
              <p>Sets: {exercise.sets}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default WorkoutHistory;
