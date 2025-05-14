import { useEffect } from 'react';
import { useWorkout } from '../common/WorkoutContext';
import ExerciseCard from './ExerciseCard';
import WorkoutTemplateCard from './WorkoutTemplateCard';
import SwipeContainer from './SwipeContainer';
import PositionIndicators from './PositionIndicators';
import ErrorBoundary from '../common/ErrorBoundary';

const ActiveWorkout = () => {
  const { state, dispatch } = useWorkout();
  const { loading, error, activeWorkout, currentExerciseIndex, workoutTemplates } = state;

  const startWorkout = (template) => {
    dispatch({ type: 'SET_ACTIVE_WORKOUT', payload: template });
  };

  return (
    <div className="workout-container">
      {loading && <div className="loading-overlay">Loading...</div>}
      {error && <div className="error-banner">{error}</div>}

      <PositionIndicators />
      <SwipeContainer currentIndex={currentExerciseIndex}>
        {workoutTemplates?.map((template, index) => (
          <ErrorBoundary key={template.templateID}>
            <WorkoutTemplateCard
              template={template}
              onStart={startWorkout}
            />
          </ErrorBoundary>
        ))}
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
      <button className="save-button">Finish Workout</button>
    </div>
  );
};

export default ActiveWorkout;
