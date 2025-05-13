// src/components/common/WorkoutContext.js
import axios from 'axios';
import { createContext, useContext, useReducer } from 'react';
const API_BASE = process.env.REACT_APP_API_BASE || 'https://4tb1rc24q2.execute-api.us-east-1.amazonaws.com/Prod';
const WorkoutContext = createContext();

const initialState = {
  activeWorkout: null,
  currentExerciseIndex: 0,
  workoutTemplates: [],
  workoutHistory: []
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_ACTIVE_WORKOUT':
      return { ...state, activeWorkout: action.payload };
    case 'SET_EXERCISE_INDEX':
      return { ...state, currentExerciseIndex: action.payload };
    case 'UPDATE_SET':
      // ... existing update logic
    case 'LOAD_TEMPLATES':
      return { ...state, workoutTemplates: action.payload };
    default:
      return state;
    case 'CLEAR_ACTIVE':
      return { 
        ...state, 
        activeWorkout: null,
        currentExerciseIndex: 0 
      };
    case 'UPDATE_SET': {
    const { exerciseID, setIndex, field, value } = action.payload;
    return {
        ...state,
        activeWorkout: {
        ...state.activeWorkout,
        exerciseList: state.activeWorkout.exerciseList.map(exercise => {
            if (exercise.exerciseID === exerciseID) {
            return {
                ...exercise,
                sets: exercise.sets.map((set, idx) => 
                idx === setIndex ? {
                    ...set,
                    values: { ...set.values, [field]: value }
                } : set
                )
            };
            }
            return exercise;
        })
        }
    };
    }
  }
};

export const WorkoutProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const saveWorkout = async () => {
    try {
      await axios.post(`${API_BASE}/workouts`, state.activeWorkout);
      dispatch({ type: 'CLEAR_ACTIVE' });
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  return (
    <WorkoutContext.Provider value={{ state, dispatch, saveWorkout }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => useContext(WorkoutContext);