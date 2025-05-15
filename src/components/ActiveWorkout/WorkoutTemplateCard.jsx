// src/components/ActiveWorkout/WorkoutTemplateCard.jsx
import React from 'react';

const WorkoutTemplateCard = ({ template, onStart }) => {
  if (!template || !template.name) {
    return <div className="template-card">Invalid Workout Template</div>;
  }

  return (
    <div className="template-card">
      <h3>{template.name || "Unnamed Template"}</h3>
      <p>Exercises: {template.exercises?.length || 0}</p>
      <button onClick={() => onStart(template)}>Start Workout</button>
    </div>
  );
};

export default WorkoutTemplateCard;

