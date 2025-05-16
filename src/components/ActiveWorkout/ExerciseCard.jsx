// src/components/ActiveWorkout/ExerciseCard.jsx
import { useWorkout } from '../common/WorkoutContext';
import React from 'react';

const ExerciseCard = React.memo(({ exercise, previousWorkouts, isActive }) => {
  const { dispatch } = useWorkout();

  if (!exercise || !Array.isArray(exercise.sets)) {
    console.warn("Invalid exercise data or sets is not an array:", JSON.stringify(exercise, null, 2));
    return (
      <div className="exercise-card">
        Invalid exercise data (sets: {JSON.stringify(exercise.sets)})
      </div>
    );
  }
  
  
  

  const handleUpdate = (setIndex, field, value) => {
    dispatch({
      type: 'UPDATE_SET',
      payload: {
        exerciseID: exercise.exerciseID,
        setIndex,
        field,
        value,
      },
    });
  };

  return (
    <div className={`exercise-card ${isActive ? 'active' : ''}`}>
      <h3>{exercise.name}</h3>
      <p>Type: {exercise.measurementType}</p>
      <div className="sets-container">
        {exercise.sets.map((set, index) => (
          <div key={index} className="set-row">
            <input
              type="number"
              placeholder="Weight"
              value={set.values?.weight || ''}
              onChange={(e) => handleUpdate(index, 'weight', parseFloat(e.target.value) || '')}
            />
            <input
              type="number"
              placeholder="Reps"
              value={set.values?.reps || ''}
              onChange={(e) => handleUpdate(index, 'reps', parseInt(e.target.value) || '')}
            />
            {exercise.measurementType === 'timed' && (
              <input
                type="text"
                placeholder="Time"
                value={set.values?.time || ''}
                onChange={(e) => handleUpdate(index, 'time', e.target.value)}
              />
            )}
            {exercise.measurementType === 'cardio' && (
              <input
                type="number"
                placeholder="Distance"
                value={set.values?.distance || ''}
                onChange={(e) => handleUpdate(index, 'distance', parseFloat(e.target.value) || '')}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

export default ExerciseCard;
