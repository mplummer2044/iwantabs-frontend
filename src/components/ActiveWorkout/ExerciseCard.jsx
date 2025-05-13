// src/components/ActiveWorkout/ExerciseCard.jsx
import { useWorkout } from '../common/WorkoutContext';

const ExerciseCard = ({ exercise, previousWorkouts, isActive }) => {
  const { dispatch } = useWorkout();
  const previousSets = previousWorkouts?.[0]?.exerciseList
    ?.find(e => e.exerciseID === exercise.exerciseID)?.sets || [];

  const handleUpdate = (setIndex, field, value) => {
    dispatch({
      type: 'UPDATE_SET',
      payload: {
        exerciseID: exercise.exerciseID,
        setIndex,
        field,
        value
      }
    });
  };

  return (
    <div className={`exercise-card ${isActive ? 'active' : ''}`}>
      <div className="card-header">
        <h2>{exercise.name}</h2>
        <span className="exercise-type">{exercise.measurementType}</span>
      </div>

      <div className="sets-container">
        {exercise.sets.map((set, setIndex) => (
          <div key={setIndex} className="set-row">
            <div className="previous-set">
              {previousSets[setIndex] && (
                <>
                  <div className={`status-badge ${previousSets[setIndex].status}`} />
                  {renderPreviousStats(previousSets[setIndex])}
                </>
              )}
            </div>
            
            <div className="current-set">
              <input
                value={set.values.weight || ''}
                onChange={(e) => handleUpdate(setIndex, 'weight', e.target.value)}
                placeholder="Weight"
              />
              <input
                value={set.values.reps || ''}
                onChange={(e) => handleUpdate(setIndex, 'reps', e.target.value)}
                placeholder="Reps"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  const renderPreviousStats = (set) => {
    switch (set.values?.measurementType) {
      case 'weights':
        return `${set.values.weight} × ${set.values.reps}`;
      case 'timed':
        return set.values.time;
      case 'cardio':
        return `${set.values.distance} mi`;
      default:
        return 'N/A';
    }
  };
};