// src/components/ActiveWorkout/index.jsx
import { useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useWorkout } from '../common/WorkoutContext';
import ExerciseCard from './ExerciseCard';
import SwipeContainer from './SwipeContainer';
import PositionIndicators from './PositionIndicators';
import ErrorBoundary from '../common/ErrorBoundary';

const ActiveWorkout = () => {
    const { state, dispatch, saveWorkout } = useWorkout();
    const { loading, error } = state;
  
    return (
      <div {...handlers} className="workout-container">
        {loading && <div className="loading-overlay">Saving...</div>}
        {error && <div className="error-banner">{error}</div>}
        
        <PositionIndicators />
        <SwipeContainer currentIndex={currentExerciseIndex}>
          {activeWorkout?.exerciseList?.map((exercise, index) => (
            <ErrorBoundary key={exercise.exerciseID}>
              <ExerciseCard
                exercise={exercise}
                index={index}
                isActive={index === currentExerciseIndex}
                previousWorkouts={activeWorkout.previousWorkouts}
              />
            </ErrorBoundary>
          ))}
        </SwipeContainer>
      </div>
    );
  };

  const handleSwipe = (direction) => {
    const maxIndex = activeWorkout?.exerciseList?.length - 1;
    const newIndex = direction === 'down' 
      ? Math.max(0, currentExerciseIndex - 1)
      : Math.min(maxIndex, currentExerciseIndex + 1);
    
    dispatch({ type: 'SET_EXERCISE_INDEX', payload: newIndex });
  };

  return (
    <div {...handlers} className="workout-container">
      <SwipeContainer currentIndex={currentExerciseIndex}>
        {activeWorkout?.exerciseList?.map((exercise, index) => (
          <ExerciseCard
            key={exercise.exerciseID}
            exercise={exercise}
            index={index}
            isActive={index === currentExerciseIndex}
            previousWorkouts={activeWorkout.previousWorkouts}
          />
        ))}
      </SwipeContainer>
      <button 
        className="save-button"
        onClick={saveWorkout}
      >
        Finish Workout
      </button>
    </div>
  );

export default ActiveWorkout;