import React, { useEffect } from 'react';
import { useWorkout } from '../common/WorkoutContext';
import ExerciseCard from './ExerciseCard';
import WorkoutTemplateCard from './WorkoutTemplateCard';
import SwipeContainer from './SwipeContainer';
import ErrorBoundary from '../common/ErrorBoundary';
import { fetchAuthSession } from 'aws-amplify/auth';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import awsConfig from '../../aws-exports';

const API_BASE = awsConfig.API.endpoints[0].endpoint;

const ActiveWorkout = () => {
  const { state, dispatch, startWorkout } = useWorkout();
  const navigate = useNavigate();
  const { loading, error, activeWorkout, currentExerciseIndex, workoutTemplates } = state;

  const handleSetValueChange = (exerciseIndex, setIndex, field, value) => {
    dispatch({
      type: 'UPDATE_EXERCISE_SET_VALUE',
      payload: { exerciseIndex, setIndex, field, value },
    });
  };

  const handleToggleStatus = (exerciseIndex, setIndex) => {
    const statusOrder = ['pending', 'good', 'medium', 'bad'];
    const currentStatus = state.activeWorkout.exerciseList[exerciseIndex].sets[setIndex].status;
    const nextStatus = statusOrder[(statusOrder.indexOf(currentStatus) + 1) % statusOrder.length];
    dispatch({
      type: 'UPDATE_EXERCISE_SET_STATUS',
      payload: { exerciseIndex, setIndex, status: nextStatus },
    });
  };

  const handleFinishWorkout = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { tokens } = await fetchAuthSession();
      const idToken = tokens.idToken.toString();
      // Prepare workout data with completion timestamp
      const finishedWorkout = {
        ...state.activeWorkout,
        completedAt: new Date().toISOString(),
      };
      // Send finished workout to API
      await axios.post(`${API_BASE}/workouts`, finishedWorkout, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      // Update state: add to history and clear active workout
      dispatch({ type: 'FINISH_WORKOUT', payload: finishedWorkout });
      // Navigate to summary page
      navigate('/summary');
    } catch (err) {
      console.error('Failed to finish workout:', err);
      dispatch({ type: 'SET_ERROR', payload: err.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  useEffect(() => {
    if (!loading && workoutTemplates.length === 0) {
      console.warn('No workout templates available.');
    }
  }, [loading, workoutTemplates]);

  return (
    <div className="workout-container">
      {loading && <div className="loading-overlay">Loading...</div>}
      {error && <div className="error-banner">{error}</div>}

      {/* Show message if no templates */}
      {!loading && !activeWorkout && workoutTemplates.length === 0 && (
        <div>No workouts available. Please create a new workout.</div>
      )}

      {/* Show templates list if no active workout is in progress */}
      {!loading && !activeWorkout && workoutTemplates.length > 0 && (
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

      {/* Active workout exercise cards */}
      {activeWorkout && Array.isArray(activeWorkout.exerciseList) && activeWorkout.exerciseList.length > 0 ? (
        <SwipeContainer currentIndex={currentExerciseIndex}>
          {activeWorkout.exerciseList.map((exercise, idx) => (
            <ErrorBoundary key={exercise.exerciseID || idx}>
              <ExerciseCard
                exercise={exercise}
                index={idx}
                onUpdateSetValue={handleSetValueChange}
                onToggleStatus={handleToggleStatus}
              />
            </ErrorBoundary>
          ))}
        </SwipeContainer>
      ) : (
        activeWorkout && <div>No exercises available in this workout.</div>
      )}

      {/* Finish Workout button (visible when a workout is active) */}
      {activeWorkout && (
        <button className="save-button" onClick={handleFinishWorkout}>
          Finish Workout
        </button>
      )}
    </div>
  );
};

export default ActiveWorkout;
