// src/components/ActiveWorkout/PositionIndicators.jsx
import { useWorkout } from '../common/WorkoutContext';

const PositionIndicators = () => {
  const { state } = useWorkout();
  
  return (
    <div className="position-indicators">
      {state.activeWorkout?.exerciseList?.map((_, i) => (
        <div 
          key={i}
          className={`indicator ${i === state.currentExerciseIndex ? 'active' : ''}`}
        />
      ))}
    </div>
  );
};

export default PositionIndicators;