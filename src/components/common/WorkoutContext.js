// src/components/common/WorkoutContext.js
import axios from 'axios';
import { createContext, useContext, useReducer } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
const API_BASE = process.env.REACT_APP_API_BASE || 'https://4tb1rc24q2.execute-api.us-east-1.amazonaws.com/Prod';
const WorkoutContext = createContext();

const initialState = {
    activeWorkout: null,
    currentExerciseIndex: 0,
    workoutTemplates: [],  // Ensure it's an array
    workoutHistory: [],
    loading: false,
    error: null,
  };
  

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOAD_TEMPLATES':
      return {
        ...state,
        workoutTemplates: action.payload.templates,
        workoutHistory: action.payload.history
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ACTIVE_WORKOUT':
      return { ...state, activeWorkout: action.payload };
    case 'SET_EXERCISE_INDEX':
      return { ...state, currentExerciseIndex: action.payload };
    case 'ADD_TEMPLATE':
        return {
            ...state,
            workoutTemplates: [...state.workoutTemplates, action.payload]
        };
    case 'UPDATE_SET':
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
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        await axios.post(`${API_BASE}/workouts`, state.activeWorkout);
        dispatch({ type: 'CLEAR_ACTIVE' });
      } catch (error) {
        console.error('Save failed:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
  
// src/components/common/WorkoutContext.js

const fetchWorkouts = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
        const { tokens } = await fetchAuthSession();
        const response = await axios.get(`${API_BASE}/templates`, {
            headers: { Authorization: tokens?.idToken?.toString() }
        });

        // Check and log the response data to ensure correct format
        console.log("Fetched Workouts:", response.data);

        const templates = response.data.templates || [];
        dispatch({
            type: 'LOAD_TEMPLATES',
            payload: {
                templates: templates,
                history: response.data.history || []
            }
        });
    } catch (error) {
        console.error("Error fetching workouts:", error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
};

    
    
    
      return (
        <WorkoutContext.Provider value={{ state, dispatch, fetchWorkouts }}>
          {children}
        </WorkoutContext.Provider>
      );
    };

export const useWorkout = () => useContext(WorkoutContext);