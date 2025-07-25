import React, { useState } from 'react';

function WorkoutTemplatesList({ templates, onStartWorkout, onDeleteTemplate }) {
  const [manageMode, setManageMode] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [confirmName, setConfirmName] = useState("");

  // Handle clicking "Delete" (opens confirmation modal)
  const handleDeleteClick = (template) => {
    setTemplateToDelete(template);
    setConfirmName("");
  };

  // Handle confirming deletion
  const confirmDeletion = async () => {
    if (!templateToDelete) return;
    try {
      const name = templateToDelete.name;
      await onDeleteTemplate(templateToDelete);
      setTemplateToDelete(null);
      setConfirmName("");
      alert(`Workout template "${name}" has been deleted.`);
    } catch (err) {
      console.error("Delete failed:", err);
      alert(`Failed to delete template: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="template-list">
      {/* Header with Manage Mode toggle */}
      <div className="templates-header">
        <h2>Your Workout Templates</h2>
        {!manageMode ? (
          <button onClick={() => setManageMode(true)}>Manage Templates</button>
        ) : (
          <button onClick={() => setManageMode(false)}>Done</button>
        )}
      </div>

      {/* List of template cards */}
      {templates.map(template => {
        // Determine the timestamp of the most recent workout (if available)
        const lastTimeISO = template.lastWorkoutTime;
        let formattedTime;
        if (lastTimeISO) {
            const dateObj = new Date(lastTimeISO);
            // Format date as "Jul 6, 2025"
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            // Format time as "6:42 PM"
            const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            formattedTime = `${dateStr} – ${timeStr}`;
        } else {
            formattedTime = "No workouts yet";
        }

        return (
            <div key={template.templateID} className="template-card">
            <h3>{template.name || "Unnamed Template"}</h3>
            {/* ... (Manage mode buttons or Start Workout button) ... */}
            <p>Exercises: {(template.exercises || []).length}</p>
            {/* Display the last workout timestamp */}
            <p className="last-workout-time">
                Last workout: {formattedTime}
            </p>
            </div>
        );
        })}

      
      {/* Confirmation Modal for deletion */}
      {templateToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Deletion</h3>
            <p>
              Type the name of the workout template <strong>"{templateToDelete.name}"</strong> to confirm deletion:
            </p>
            <input 
              type="text"
              placeholder="Enter template name to delete"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={() => {
                setTemplateToDelete(null);
                setConfirmName("");
              }}>
                Cancel
              </button>
              <button 
                className="delete-btn"
                onClick={confirmDeletion}
                disabled={confirmName.trim() !== templateToDelete.name}>
                Delete Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkoutTemplatesList;
