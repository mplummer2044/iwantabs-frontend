import React from 'react';

function WorkoutTemplatesList({ templates, onStartWorkout }) {
  return (
    <div className="template-list">
      <h2>Your Workout Templates</h2>
      {templates.map(template => (
        <div key={template.templateID} className="template-card">
          <h3>{template?.name || "Unnamed Template"}</h3>
          <button onClick={() => onStartWorkout(template)}>
            Start Workout
          </button>
          <p>Exercises: {(template?.exercises || []).length}</p>
        </div>
      ))}
    </div>
  );
}

export default WorkoutTemplatesList;
