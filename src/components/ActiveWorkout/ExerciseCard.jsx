// src/components/ActiveWorkout/ExerciseCard.jsx
import { useWorkout } from '../common/WorkoutContext';
import React from 'react';

const ExerciseCard = React.memo(({ exercise, previousWorkouts, isActive }) => {
  const { dispatch } = useWorkout();

  // Safely access previous sets
  const previousSets = previousWorkouts?.[0]?.exerciseList
    ?.find(e => e.exerciseID === exercise.exerciseID)?.sets || [];

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

  const renderPreviousStats = (set) => {
    if (!set?.values) return 'N/A';
    switch (exercise.measurementType) {
      case 'weights':
        return `${set.values.weight || 'N/A'} × ${set.values.reps || 'N/A'}`;
      case 'timed':
        return set.values.time || 'N/A';
      case 'cardio':
        return `${set.values.distance || 'N/A'} mi`;
      default:
        return 'N/A';
    }
  };

  return (
    <div className={`exercise-card ${isActive ? 'active' : ''}`}>
      <div className="card-header">
        <h2>{exercise.name}</h2>
        <span className="exercise-type">{exercise.measurementType}</span>
      </div>

      <div className="sets-container">
        {exercise.sets.map((set, setIndex) => (
          <div key={setIndex} className="set-row">
            <div className="previous-set">
              {previousSets[setIndex] && (
                <>
                  <div className={`status-badge ${previousSets[setIndex].status}`} />
                  {renderPreviousStats(previousSets[setIndex])}
                </>
              )}
            </div>
            
            <div className="current-set">
              <input
                type="number"
                value={set.values.weight || ''}
                onChange={(e) => handleUpdate(setIndex, 'weight', parseFloat(e.target.value) || '')}
                placeholder="Weight"
              />
              <input
                type="number"
                value={set.values.reps || ''}
                onChange={(e) => handleUpdate(setIndex, 'reps', parseInt(e.target.value) || '')}
                placeholder="Reps"
              />
              {exercise.measurementType === 'timed' && (
                <input
                  type="text"
                  value={set.values.time || ''}
                  onChange={(e) => handleUpdate(setIndex, 'time', e.target.value)}
                  placeholder="Time"
                />
              )}
              {exercise.measurementType === 'cardio' && (
                <input
                  type="number"
                  value={set.values.distance || ''}
                  onChange={(e) => handleUpdate(setIndex, 'distance', parseFloat(e.target.value) || '')}
                  placeholder="Distance"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}, 
(prevProps, nextProps) => (
  prevProps.isActive === nextProps.isActive &&
  prevProps.exercise.exerciseID === nextProps.exercise.exerciseID &&
  JSON.stringify(prevProps.exercise.sets) === JSON.stringify(nextProps.exercise.sets)
));

export default ExerciseCard;
