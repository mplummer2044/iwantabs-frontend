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
    console.log("Workout Templates in ActiveWorkout (from state):", workoutTemplates);
    if (Array.isArray(workoutTemplates) && workoutTemplates.length > 0) {
      workoutTemplates.forEach((template, idx) => {
        console.log(`Template ${idx + 1}:`, template);
      });
    } else {
      console.warn("No templates loaded in state");
    }
  }, [workoutTemplates]);
  
  

  return (
    <div className="workout-container">
      {loading && <div className="loading-overlay">Loading...</div>}
      {error && <div className="error-banner">{error}</div>}
      
      {!loading && workoutTemplates.length === 0 && (
        <div>No workouts available. Please create a new workout.</div>
      )}
  
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
  
      {activeWorkout && Array.isArray(activeWorkout.exerciseList) && activeWorkout.exerciseList.length > 0 ? (
      <SwipeContainer currentIndex={currentExerciseIndex}>
        {activeWorkout.exerciseList.map((exercise, index) => (
          <ErrorBoundary key={exercise.exerciseID}>
            <ExerciseCard
              exercise={exercise}
              isActive={index === currentExerciseIndex}
              previousWorkouts={activeWorkout.previousWorkouts || []}
            />
          </ErrorBoundary>
        ))}
      </SwipeContainer>
    ) : (
      <div>No exercises available in this workout.</div>
    )}

      <button className="save-button">Finish Workout</button>
    </div>
  );
};




export default ActiveWorkout;
