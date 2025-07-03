import axios from 'axios';
import { createContext, useContext, useReducer } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://4tb1rc24q2.execute-api.us-east-1.amazonaws.com/Prod';
const WorkoutContext = createContext();

const initialState = {
  activeWorkout: null,
  currentExerciseIndex: 0,
  workoutTemplates: [],
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
        workoutHistory: action.payload.history,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ACTIVE_WORKOUT': {
      const workoutData = action.payload;
      // Ensure exerciseList key is normalized
      if (!Array.isArray(workoutData.exerciseList) && Array.isArray(workoutData.exercises)) {
        workoutData.exerciseList = workoutData.exercises;
        delete workoutData.exercises;
      }
      return { ...state, activeWorkout: workoutData };
    }
    case 'SET_EXERCISE_INDEX':
      return { ...state, currentExerciseIndex: action.payload };
    case 'ADD_TEMPLATE':
      return {
        ...state,
        workoutTemplates: [...state.workoutTemplates, action.payload],
      };
    case 'UPDATE_EXERCISE_SET_VALUE': {
      const { exerciseIndex, setIndex, field, value } = action.payload;
      const updatedWorkout = { ...state.activeWorkout };
      if (updatedWorkout.exerciseList?.[exerciseIndex]?.sets?.[setIndex]?.values) {
        updatedWorkout.exerciseList[exerciseIndex].sets[setIndex].values[field] = value;
      }
      return { ...state, activeWorkout: updatedWorkout };
    }
    case 'UPDATE_EXERCISE_SET_STATUS': {
      const { exerciseIndex, setIndex, status } = action.payload;
      const updatedWorkout = { ...state.activeWorkout };
      if (updatedWorkout.exerciseList?.[exerciseIndex]?.sets?.[setIndex]) {
        updatedWorkout.exerciseList[exerciseIndex].sets[setIndex].status = status;
      }
      return { ...state, activeWorkout: updatedWorkout };
    }
    case 'CLEAR_ACTIVE':
      return { ...state, activeWorkout: null, currentExerciseIndex: 0 };
    case 'FINISH_WORKOUT': {
      const finishedWorkout = action.payload;
      return {
        ...state,
        activeWorkout: null,
        currentExerciseIndex: 0,
        workoutHistory: [finishedWorkout, ...state.workoutHistory],
      };
    }
    default:
      return state;
  }
};

export const WorkoutProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchWorkouts = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { tokens } = await fetchAuthSession();
      const token = tokens?.idToken?.toString();
      if (!token) throw new Error('Authorization token not found');
      const response = await axios.get(`${API_BASE}/templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const templates = Array.isArray(response.data.templates) ? response.data.templates : [];
      const history = Array.isArray(response.data.history)
        ? response.data.history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];
      dispatch({
        type: 'LOAD_TEMPLATES',
        payload: { templates, history },
      });
    } catch (error) {
      console.error('Error fetching workouts:', error.response?.data || error.message);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const startWorkout = async (template) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { tokens } = await fetchAuthSession();
      const idToken = tokens.idToken.toString();
      const userId = tokens.idToken.payload.sub;
      // Fetch recent workouts for this template (to get previous stats)
      const res = await axios.get(`${API_BASE}/history`, {
        params: { templateID: template.templateID, limit: 2 },
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const prevWorkouts = Array.isArray(res.data) ? res.data : [];
      // Normalize sets for each exercise in the template
      const normalizeSets = (sets) => {
        if (Array.isArray(sets)) return sets;
        if (typeof sets === 'number') {
          return Array.from({ length: sets }, () => ({
            values: { reps: null, weight: null, distance: null, time: null },
            status: 'pending',
          }));
        }
        return [];
      };
      const exerciseList = template.exercises.map((ex) => ({
        ...ex,
        sets: normalizeSets(ex.sets),
      }));
      const newWorkout = {
        userID: userId,
        workoutID: `workout_${Date.now()}`,
        templateID: template.templateID,
        name: template.name || 'Workout',
        createdAt: new Date().toISOString(),
        exerciseList,
        previousWorkouts: prevWorkouts.map((w) => ({
          ...w,
          exerciseList: w.exerciseList || [],
        })),
      };
      dispatch({ type: 'SET_ACTIVE_WORKOUT', payload: newWorkout });
    } catch (error) {
      console.error('Error starting workout:', error.message);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <WorkoutContext.Provider value={{ state, dispatch, fetchWorkouts, startWorkout }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => useContext(WorkoutContext);
