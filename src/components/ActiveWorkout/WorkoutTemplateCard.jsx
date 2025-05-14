// src/components/ActiveWorkout/WorkoutTemplateCard.jsx
import React from 'react';

const WorkoutTemplateCard = ({ template, onStart }) => {
  return (
    <div className="template-card">
      <h3>{template.name}</h3>
      <p>Exercises: {template.exercises.length}</p>
      <button onClick={() => onStart(template)}>Start Workout</button>
    </div>
  );
};

export default WorkoutTemplateCard;
