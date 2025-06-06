import React from 'react';

const ExerciseCard = ({ exercise, index, onUpdateSetValue }) => {
  const handleChange = (setIndex, field, value) => {
    onUpdateSetValue(index, setIndex, field, value);
  };

  return (
    <div className="exercise-card">
      <h2>{exercise.name}</h2>
      {exercise.sets.map((set, setIndex) => (
        <div key={setIndex} className="set-row">
          {exercise.measurementType === 'weights' && (
            <>
            <span
            className={`status-indicator ${set.status}`}
            onClick={() => onToggleStatus(index, setIndex)}
            title={`Mark set as ${set.status}`}
            />

              <input
                type="number"
                placeholder="Weight"
                value={set.values?.weight || ''}
                onChange={(e) => handleChange(setIndex, 'weight', e.target.value)}
              />
              <input
                type="number"
                placeholder="Reps"
                value={set.values?.reps || ''}
                onChange={(e) => handleChange(setIndex, 'reps', e.target.value)}
              />
            </>
          )}

          {exercise.measurementType === 'bodyweight' && (
            <input
              type="number"
              placeholder="Reps"
              value={set.values?.reps || ''}
              onChange={(e) => handleChange(setIndex, 'reps', e.target.value)}
            />
          )}

          {exercise.measurementType === 'timed' && (
            <input
              type="text"
              placeholder="Time"
              value={set.values?.time || ''}
              onChange={(e) => handleChange(setIndex, 'time', e.target.value)}
            />
          )}

          {exercise.measurementType === 'cardio' && (
            <input
              type="number"
              placeholder="Distance"
              value={set.values?.distance || ''}
              onChange={(e) => handleChange(setIndex, 'distance', e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default ExerciseCard;
