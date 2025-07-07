import React, { useState } from 'react';

function ActiveWorkout({ activeWorkout, updateActiveWorkout, onFinish }) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [touchStartY, setTouchStartY] = useState(null);

  // Touch event handlers for swipe navigation
  const handleTouchStart = (e) => {
    if (e.touches.length > 0) {
      setTouchStartY(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartY === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY - touchEndY;
    // Swipe threshold of 30px and ignore swipes on input fields
    if (Math.abs(deltaY) > 30 && !e.target.closest('input')) {
      setCurrentExerciseIndex(prevIndex => {
        if (deltaY > 0) {
          // Swipe up -> next exercise
          return Math.min(prevIndex + 1, activeWorkout.exerciseList.length - 1);
        } else {
          // Swipe down -> previous exercise
          return Math.max(prevIndex - 1, 0);
        }
      });
    }
    setTouchStartY(null);
  };

  const handleTouchMove = (e) => {
    // Prevent default scrolling when swiping between cards (unless focusing an input)
    if (!e.target.closest('input')) {
      e.preventDefault();
    }
  };

  // Cycle the status indicator for a set (good -> medium -> bad -> back to good)
  const handleCycleStatus = (exerciseIndex, setIndex) => {
    const statuses = ['good', 'medium', 'bad'];
    updateActiveWorkout(prevWorkout => {
      if (!prevWorkout) return prevWorkout;
      const updatedList = [...prevWorkout.exerciseList];
      const currentStatus = updatedList[exerciseIndex].sets[setIndex].status;
      const newStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];
      updatedList[exerciseIndex].sets[setIndex].status = newStatus;
      return { ...prevWorkout, exerciseList: updatedList };
    });
  };

  // Handle changes in input values for a set (weight, reps, time, distance)
  const handleValueChange = (exerciseIndex, setIndex, field, value) => {
    updateActiveWorkout(prevWorkout => {
      if (!prevWorkout) return prevWorkout;
      const updatedExercises = [...prevWorkout.exerciseList];

      if (field === 'time') {
        // Time values are kept as strings (MM:SS format) or null
        updatedExercises[exerciseIndex].sets[setIndex].values.time = value || null;
      } else {
        // Numeric fields: convert empty string to null, otherwise to Number
        updatedExercises[exerciseIndex].sets[setIndex].values[field] =
          value === '' ? null : Number(value);

        // Autofill logic: if editing the first set of a weighted exercise
        if (field === 'reps' && setIndex === 0 && updatedExercises[exerciseIndex].measurementType === 'weights') {
          const newRepsVal = value === '' ? null : Number(value);
          // Auto-fill reps for subsequent sets if they are still null
          for (let i = 1; i < updatedExercises[exerciseIndex].sets.length; i++) {
            if (updatedExercises[exerciseIndex].sets[i].values.reps === null) {
              updatedExercises[exerciseIndex].sets[i].values.reps = newRepsVal;
            }
          }
        }
        if (field === 'weight' && setIndex === 0 && updatedExercises[exerciseIndex].measurementType === 'weights') {
          const baseWeight = value === '' ? null : Number(value);
          if (baseWeight !== null) {
            // Auto-increase weight by 5 for each subsequent set
            updatedExercises[exerciseIndex].sets.forEach((setObj, idx) => {
              if (idx > 0) {
                setObj.values.weight = baseWeight + 5 * idx;
              }
            });
          } else {
            // If first weight is cleared, clear all subsequent weights
            updatedExercises[exerciseIndex].sets.forEach((setObj, idx) => {
              if (idx > 0) {
                setObj.values.weight = null;
              }
            });
          }
        }
      }

      return { ...prevWorkout, exerciseList: updatedExercises };
    });
  };

  // Utility to format time input as MM:SS
  const formatTimeInput = (val) => {
    if (!val) return '';
    let cleaned = val.replace(/[^0-9:]/g, '');       // remove non-numeric except colon
    if (cleaned.length < val.length) return cleaned; // allow backspace
    if (cleaned.length === 2 && !cleaned.includes(':')) {
      return cleaned + ':';                          // insert colon after 2 digits
    }
    if (cleaned.length > 2 && !cleaned.includes(':')) {
      cleaned = cleaned.slice(0, 2) + ':' + cleaned.slice(2);
    }
    return cleaned.substring(0, 5);                  // max length 5 (MM:SS)
  };

  // Validate that the time input is in a partial or full MM:SS format
  const validateTimeInput = (val) => {
    return /^\d{0,2}:?\d{0,2}$/.test(val);
  };

  // Render set values (for previous workout display)
  const renderSetValues = (measurementType, values) => {
    if (!values) return null;
    switch (measurementType) {
      case 'weights':
        return <span>{values.weight ?? '-'} × {values.reps ?? '-'}</span>;
      case 'bodyweight':
        return <span>{values.reps ?? '-'}</span>;
      case 'timed':
        return <span>{values.time ?? '-'}</span>;
      case 'cardio':
        return <span>{values.distance ?? '-'} mi</span>;
      default:
        return null;
    }
  };

  return (
    <div 
      className="workout-grid" 
      onTouchStart={handleTouchStart} 
      onTouchEnd={handleTouchEnd} 
      onTouchMove={handleTouchMove} 
      style={{ display: 'block' }}
    >
      {/* Navigation Dots */}
      <div className="exercise-nav-dots">
        {activeWorkout.exerciseList.map((_, idx) => (
          <div 
            key={idx} 
            className={`nav-dot ${idx === currentExerciseIndex ? 'active' : ''}`} 
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
              zIndex: Math.abs(exIndex - currentExerciseIndex) * -1,
              opacity: exIndex === currentExerciseIndex ? 1 : 0.5
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
              {exercise.sets.map((_, setIdx) => (
                <div key={setIdx} className="set-data">
                  {/** Only render if a corresponding set exists in the last workout */}
                  {activeWorkout.previousWorkouts?.[0]?.exerciseList
                     ?.find(e => e.exerciseID === exercise.exerciseID)?.sets?.[setIdx] && (
                    <div className="previous-set">
                      <span className={`status-indicator ${
                        activeWorkout.previousWorkouts[0].exerciseList
                          .find(e => e.exerciseID === exercise.exerciseID)
                          .sets[setIdx].status
                      }`} />
                      {renderSetValues(
                        exercise.measurementType,
                        activeWorkout.previousWorkouts[0].exerciseList
                          .find(e => e.exerciseID === exercise.exerciseID)
                          .sets[setIdx].values
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Current Workout Section */}
            <div className="current-cell" data-label="Current Workout">
              {exercise.sets.map((set, setIdx) => (
                <div key={setIdx} className="current-set">
                  {/* Status indicator (click to cycle status) */}
                  <div 
                    className={`status-indicator ${set.status}`} 
                    onClick={() => handleCycleStatus(exIndex, setIdx)} 
                  />
                  {/* Input fields for each measurement type */}
                  {exercise.measurementType === 'weights' && (
                    <div className="weight-reps">
                      <input 
                        type="number" 
                        placeholder="Wgt"
                        value={set.values.weight ?? ''} 
                        onChange={(e) => handleValueChange(exIndex, setIdx, 'weight', e.target.value)}
                      />
                      <span>×</span>
                      <input 
                        type="number" 
                        placeholder="Reps"
                        value={set.values.reps ?? ''} 
                        onChange={(e) => handleValueChange(exIndex, setIdx, 'reps', e.target.value)}
                      />
                    </div>
                  )}
                  {exercise.measurementType === 'bodyweight' && (
                    <div className="weight-reps">
                      <input 
                        type="number" 
                        placeholder="Reps"
                        value={exercise.sets[setIdx]?.values?.reps ?? ''} 
                        onChange={(e) => handleValueChange(exIndex, setIdx, 'reps', e.target.value)}
                      />
                      {activeWorkout.previousWorkouts?.[0]?.exerciseList
                         ?.find(e => e.exerciseID === exercise.exerciseID)
                         ?.sets?.[setIdx]?.values?.reps && (
                        <p>
                          Last: {activeWorkout.previousWorkouts[0].exerciseList
                                   .find(e => e.exerciseID === exercise.exerciseID)
                                   .sets[setIdx].values.reps} reps
                        </p>
                      )}
                    </div>
                  )}
                  {exercise.measurementType === 'timed' && (
                    <div className="time-input">
                      <input 
                        type="text" 
                        placeholder="MM:SS"
                        value={set.values.time ?? ''} 
                        onChange={(e) => {
                          const formatted = formatTimeInput(e.target.value);
                          if (validateTimeInput(formatted)) {
                            handleValueChange(exIndex, setIdx, 'time', formatted);
                          }
                        }}
                      />
                    </div>
                  )}
                  {exercise.measurementType === 'cardio' && (
                    <input 
                      type="number" 
                      placeholder="Miles"
                      value={set.values.distance ?? ''} 
                      onChange={(e) => handleValueChange(exIndex, setIdx, 'distance', e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Finish Workout Button */}
      <div className="footer-cell">
        <button onClick={onFinish}>Finish Workout</button>
      </div>
    </div>
  );
}

export default ActiveWorkout;
