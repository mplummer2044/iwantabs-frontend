// src/components/ActiveWorkout/index.jsx
import { useEffect } from 'react';
import { useWorkout } from '../common/WorkoutContext';
import ExerciseCard from './ExerciseCard';
import WorkoutTemplateCard from './WorkoutTemplateCard';
import SwipeContainer from './SwipeContainer';
import PositionIndicators from './PositionIndicators';
import ErrorBoundary from '../common/ErrorBoundary';
import { fetchAuthSession } from 'aws-amplify/auth';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';



const ActiveWorkout = ({ onStartWorkout }) => {
  const { state, dispatch } = useWorkout();
  const handleSetValueChange = (exerciseIndex, setIndex, field, value) => {
    dispatch({
      type: 'UPDATE_EXERCISE_SET_VALUE',
      payload: { exerciseIndex, setIndex, field, value },
    });
  };
  const handleFinishWorkout = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
  
    try {
      const { tokens } = await fetchAuthSession();
      const idToken = tokens.idToken.toString();
  
      const finishedWorkout = {
        ...state.activeWorkout,
        finishedAt: new Date().toISOString()
      };
  
      await axios.post(`${API_BASE}/workouts`, finishedWorkout, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
  
      const newHistory = [finishedWorkout, ...state.workoutHistory];
  
      dispatch({
        type: 'LOAD_TEMPLATES',
        payload: {
          templates: state.workoutTemplates,
          history: newHistory
        }
      });
  
      dispatch({ type: 'CLEAR_ACTIVE' });
      props.onFinishWorkout(); // Switch view to summary
    } catch (err) {
      console.error("Failed to finish workout:", err);
      dispatch({ type: 'SET_ERROR', payload: err.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };
  
  const { loading, error, activeWorkout, currentExerciseIndex, workoutTemplates } = state;

  const handleToggleStatus = (exerciseIndex, setIndex) => {
    const statusOrder = ['pending', 'good', 'medium', 'bad'];
    const currentStatus = state.activeWorkout.exerciseList[exerciseIndex].sets[setIndex].status;
    const nextStatus = statusOrder[(statusOrder.indexOf(currentStatus) + 1) % statusOrder.length];
  
    dispatch({
      type: 'UPDATE_EXERCISE_SET_STATUS',
      payload: { exerciseIndex, setIndex, status: nextStatus }
    });
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
              onStart={() => onStartWorkout(template)}
            />
          ))}

        </div>
      )}
  
      {activeWorkout && Array.isArray(activeWorkout.exerciseList) && activeWorkout.exerciseList.length > 0 ? (
      <SwipeContainer currentIndex={currentExerciseIndex}>
        {activeWorkout.exerciseList.map((exercise, index) => (
          <ErrorBoundary key={exercise.exerciseID}>
            <ExerciseCard
              key={exercise.exerciseID}
              exercise={exercise}
              index={index}
              onUpdateSetValue={handleSetValueChange}
              onToggleStatus={handleToggleStatus}
            />

          </ErrorBoundary>
        ))}
      </SwipeContainer>
    ) : (
      <div>No exercises available in this workout.</div>
    )}

      {activeWorkout && (
        <button className="save-button" onClick={handleFinishWorkout}>
          Finish Workout
        </button>
      )}
    </div>
  );
};




export default ActiveWorkout;
