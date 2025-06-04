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
  
// Export the parseDynamoDBItem function to use it in other files
export const parseDynamoDBItem = (item) => {
    const parseValue = (val) => {
      if (val.S !== undefined) return val.S;
      if (val.N !== undefined) return Number(val.N);
      if (val.BOOL !== undefined) return val.BOOL;
      if (val.NULL !== undefined) return null;
      if (val.L !== undefined) return val.L.map(parseValue);
      if (val.M !== undefined) {
        const obj = {};
        for (const key in val.M) {
          obj[key] = parseValue(val.M[key]);
        }
        return obj;
      }
      return val;
    };
    return parseValue(item);
};
const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOAD_TEMPLATES':
    console.log("Setting templates in state:", action.payload.templates);
    if (Array.isArray(action.payload.templates) && action.payload.templates.length > 0) {
        console.log("Templates loaded successfully:", action.payload.templates);
    } else {
        console.warn("Templates not loaded correctly or empty:", action.payload.templates);
    }
    return {
        ...state,
        workoutTemplates: action.payload.templates,
        workoutHistory: action.payload.history,
    }; 
    case 'UPDATE_EXERCISE_SET_VALUE':
        const updatedWorkout = { ...state.activeWorkout };
        const { exerciseIndex, setIndex, field, value } = action.payload;

        if (
            updatedWorkout.exerciseList?.[exerciseIndex]?.sets?.[setIndex]?.values
        ) {
            updatedWorkout.exerciseList[exerciseIndex].sets[setIndex].values[field] = value;
        }

        return {
            ...state,
            activeWorkout: updatedWorkout,
        };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ACTIVE_WORKOUT': {
    const workoutData = action.payload;
    // Normalize to ensure the exerciseList key is used
    if (!Array.isArray(workoutData.exerciseList) && Array.isArray(workoutData.exercises)) {
        workoutData.exerciseList = workoutData.exercises;
        delete workoutData.exercises;  // Remove redundant key
    }
    return { ...state, activeWorkout: workoutData };
    }   
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

  
  const fetchWorkouts = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
        const { tokens } = await fetchAuthSession();
        const token = tokens?.idToken?.toString();

        if (!token) throw new Error("Authorization token not found");

        console.log("Fetching workouts from API...");
        const response = await axios.get(`${API_BASE}/templates`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("API Response:", response.data);

        // Directly check if templates are in the response
        if (!Array.isArray(response.data.templates)) {
            console.warn("Expected templates as an array, got:", response.data);
        }

        const templates = response.data.templates || [];
        console.log("Extracted Templates:", templates);

        dispatch({
            type: 'LOAD_TEMPLATES',
            payload: {
                templates: templates,
                history: response.data.history || []
            }
        });
    } catch (error) {
        console.error("Error fetching workouts:", error.response?.data || error.message);
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