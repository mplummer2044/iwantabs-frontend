// src/components/WorkoutBuilder/index.jsx
import React, { useState } from 'react';
import { useWorkout } from '../common/WorkoutContext';

const WorkoutBuilder = () => {
  const { dispatch } = useWorkout();
  const [templateName, setTemplateName] = useState('');
  const [exercises, setExercises] = useState([]);

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: 1, measurementType: 'weights' }]);
  };

  const updateExercise = (index, field, value) => {
    const updatedExercises = [...exercises];
    updatedExercises[index][field] = value;
    setExercises(updatedExercises);
  };

  const removeExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const saveTemplate = () => {
    dispatch({ type: 'ADD_TEMPLATE', payload: { name: templateName, exercises } });
    setTemplateName('');
    setExercises([]);
  };

  return (
    <div>
      <h2>Create Workout Template</h2>
      <input
        placeholder="Workout Name"
        value={templateName}
        onChange={(e) => setTemplateName(e.target.value)}
      />
      {exercises.map((exercise, index) => (
        <div key={index}>
          <input
            placeholder="Exercise Name"
            value={exercise.name}
            onChange={(e) => updateExercise(index, 'name', e.target.value)}
          />
          <select
            value={exercise.measurementType}
            onChange={(e) => updateExercise(index, 'measurementType', e.target.value)}
          >
            <option value="weights">Weight × Reps</option>
            <option value="bodyweight">Reps</option>
            <option value="timed">Time</option>
            <option value="cardio">Distance</option>
          </select>
          <input
            type="number"
            placeholder="Sets"
            value={exercise.sets}
            onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
          />
          <button onClick={() => removeExercise(index)}>Remove</button>
        </div>
      ))}
      <button onClick={addExercise}>Add Exercise</button>
      <button onClick={saveTemplate}>Save Template</button>
    </div>
  );
};

export default WorkoutBuilder;
