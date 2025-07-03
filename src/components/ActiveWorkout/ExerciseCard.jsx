import React from 'react';

const ExerciseCard = ({ exercise, index, onUpdateSetValue, onToggleStatus }) => {
  const { name, measurementType, sets } = exercise;

  const handleInputChange = (field, value, exerciseIndex, setIndex) => {
    // Convert input value to proper type or null
    let parsedValue;
    if (value === '' || value === null) {
      parsedValue = null;
    } else if (field === 'reps') {
      parsedValue = parseInt(value);
    } else {
      parsedValue = parseFloat(value);
    }
    if (isNaN(parsedValue)) {
      parsedValue = null;
    }
    onUpdateSetValue(exerciseIndex, setIndex, field, parsedValue);
  };

  return (
    <div className="exercise-card">
      <h3>{name}</h3>
      {sets.map((set, setIndex) => {
        const setValues = set.values || {};
        return (
          <div key={setIndex} className="set-row">
            <span>Set {setIndex + 1}:</span>
            {measurementType === 'weights' && (
              <>
                <input
                  type="number"
                  placeholder="Weight"
                  value={setValues.weight ?? ''}
                  onChange={(e) => handleInputChange('weight', e.target.value, index, setIndex)}
                />
                <input
                  type="number"
                  placeholder="Reps"
                  value={setValues.reps ?? ''}
                  onChange={(e) => handleInputChange('reps', e.target.value, index, setIndex)}
                />
              </>
            )}
            {measurementType === 'bodyweight' && (
              <input
                type="number"
                placeholder="Reps"
                value={setValues.reps ?? ''}
                onChange={(e) => handleInputChange('reps', e.target.value, index, setIndex)}
              />
            )}
            {measurementType === 'timed' && (
              <input
                type="number"
                placeholder="Time (sec)"
                value={setValues.time ?? ''}
                onChange={(e) => handleInputChange('time', e.target.value, index, setIndex)}
              />
            )}
            {measurementType === 'cardio' && (
              <input
                type="number"
                placeholder="Distance"
                value={setValues.distance ?? ''}
                onChange={(e) => handleInputChange('distance', e.target.value, index, setIndex)}
              />
            )}
            <span
              className={`status-dot ${set.status}`}
              onClick={() => onToggleStatus(index, setIndex)}
              role="button"
              aria-label={`Toggle status of set ${setIndex + 1} (${set.status})`}
            />
          </div>
        );
      })}
    </div>
  );
};

export default ExerciseCard;
