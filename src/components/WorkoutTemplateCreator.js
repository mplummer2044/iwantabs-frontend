import React, { useState } from 'react';

function WorkoutTemplateCreator({ onSave }) {
  // Initial state for a new template (one blank exercise)
  const INITIAL_EXERCISE = { 
    name: '', 
    measurementType: 'weights', 
    sets: 1, 
    previousStats: null 
  };
  const INITIAL_TEMPLATE = { name: '', exercises: [ { ...INITIAL_EXERCISE } ] };
  const [template, setTemplate] = useState(INITIAL_TEMPLATE);

  // Handle changes to the workout name
  const handleNameChange = (e) => {
    setTemplate({ ...template, name: e.target.value });
  };

  // Handle changes to an exercise's name (and assign an ID if not set)
  const handleExerciseNameChange = (index, value) => {
    const exercises = [...template.exercises];
    exercises[index] = {
      ...exercises[index],
      name: value,
      // Assign a unique ID if not already present
      exerciseID: exercises[index].exerciseID || `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    setTemplate({ ...template, exercises });
  };

  // Handle changes to number of sets for an exercise
  const handleSetsChange = (index, value) => {
    const exercises = [...template.exercises];
    exercises[index].sets = parseInt(value, 10);
    setTemplate({ ...template, exercises });
  };

  // Handle changes to measurement type for an exercise
  const handleTypeChange = (index, value) => {
    const exercises = [...template.exercises];
    exercises[index].measurementType = value;
    setTemplate({ ...template, exercises });
  };

  // Remove an exercise from the template
  const handleRemoveExercise = (index) => {
    const exercises = template.exercises.filter((_, i) => i !== index);
    setTemplate({ ...template, exercises });
  };

  // Add a new blank exercise to the template form
  const handleAddExercise = () => {
    setTemplate({ 
      ...template, 
      exercises: [...template.exercises, { ...INITIAL_EXERCISE }] 
    });
  };

  // Save the template by calling the parent handler (which will call the API)
  const handleSaveTemplate = async () => {
    try {
      await onSave(template);
      // Reset the form to a new blank template after successful save
      setTemplate(INITIAL_TEMPLATE);
    } catch (err) {
      console.error("Template save failed:", err);
      alert(`Failed to save template: ${err.response?.data?.message || err.message}`);
      // (Form is not cleared so user can adjust and retry)
    }
  };

  return (
    <div className="workout-creator">
      <h2>Create Workout Template</h2>
      <input 
        type="text" 
        placeholder="Workout Name" 
        value={template.name} 
        onChange={(e) => handleNameChange(e)} 
      />
      {template.exercises.map((exercise, index) => (
        <div key={index} className="exercise-block">
          <input
            placeholder="Exercise Name"
            value={exercise.name}
            onChange={(e) => handleExerciseNameChange(index, e.target.value)}
          />
          <select 
            value={exercise.sets} 
            onChange={(e) => handleSetsChange(index, e.target.value)}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <option key={num} value={num}>
                {num} Set{num !== 1 ? 's' : ''}
              </option>
            ))}
          </select>
          <select 
            value={exercise.measurementType} 
            onChange={(e) => handleTypeChange(index, e.target.value)}
          >
            <option value="weights">Weight × Sets × Reps</option>
            <option value="bodyweight">Bodyweight (Reps)</option>
            <option value="timed">Time</option>
            <option value="cardio">Distance</option>
          </select>
          <button onClick={() => handleRemoveExercise(index)}>
            Remove
          </button>
        </div>
      ))}
      <button onClick={handleAddExercise}>Add Exercise</button>{' '}
      <button onClick={handleSaveTemplate}>Save Template</button>
    </div>
  );
}

export default WorkoutTemplateCreator;
