// src/components/ActiveWorkout/index.jsx
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

  useEffect(() => {
    console.log("Workout Templates:", workoutTemplates); // Log to verify data
  }, [workoutTemplates]);

// src/components/ActiveWorkout/index.jsx

return (
    <div className="workout-container">
      {loading && <div className="loading-overlay">Loading...</div>}
      {error && <div className="error-banner">{error}</div>}
  
      <PositionIndicators />
  
      {/* Render Template Cards if no active workout */}
      {!activeWorkout && workoutTemplates.length > 0 && (
        <div className="template-list">
          <h2>Your Workout Templates</h2>
          {workoutTemplates.map((template) => (
            <WorkoutTemplateCard
              key={template.templateID}
              template={template}
              onStart={() => startWorkout(template)}
            />
          ))}
        </div>
      )}
  
      {activeWorkout && (
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
      )}
  
      <button className="save-button">Finish Workout</button>
    </div>
  );
  

export default ActiveWorkout;
