import React from 'react';

function WorkoutHistory({ history, templates }) {
  return (
    <div className="workout-history">
      <h2>Workout History</h2>
      {history.map(workout => (
        <div key={workout.workoutID} className="workout-log">
          <div className="workout-header">
            <h3>{new Date(workout.createdAt).toLocaleDateString()}</h3>
            {workout.templateID && (
              <small>
                From template: {
                  templates.find(t => t.templateID === workout.templateID)?.name
                }
              </small>
            )}
          </div>
          {workout.exercises?.map((exercise, exIndex) => (
            <div key={exIndex} className="exercise-history">
              <h5>{exercise.name}</h5>
              {exercise.sets?.map((set, setIndex) => (
                <div key={setIndex} className="set-history">
                  {set.values && Object.entries(set.values).map(([key, value]) => (
                    <span key={key}>
                      {key}: {value ?? 'N/A'}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default WorkoutHistory;
