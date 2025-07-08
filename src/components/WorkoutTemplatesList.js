import React, { useState } from 'react';

function WorkoutTemplatesList({ templates, onStartWorkout, onDeleteTemplate }) {
  // NEW state: manage mode toggle & delete confirmation
  const [manageMode, setManageMode] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [confirmName, setConfirmName] = useState("");

  // Handle clicking the "Delete" button for a template (open confirm modal)
  const handleDeleteClick = (template) => {
    setTemplateToDelete(template);
    setConfirmName("");  // reset input each time
  };

  // Handle confirming the deletion in the modal
  const confirmDeletion = async () => {
    if (!templateToDelete) return;
    try {
      const name = templateToDelete.name;
      await onDeleteTemplate(templateToDelete);
      // On success, close modal and notify (template list will update via state)
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
      {templates.map(template => (
        <div key={template.templateID} className="template-card">
          <h3>{template.name || "Unnamed Template"}</h3>
          {manageMode ? (
            <>
              {/* In manage mode, show Delete button (and future Edit button if needed) */}
              <button 
                className="delete-btn" 
                onClick={() => handleDeleteClick(template)}
              >
                Delete
              </button>
              {/* (You can add an Edit button here in the future) */}
            </>
          ) : (
            <button onClick={() => onStartWorkout(template)}>
              Start Workout
            </button>
          )}
          <p>Exercises: {(template.exercises || []).length}</p>
        </div>
      ))}

      {/* Confirmation Modal (shown when templateToDelete is set) */}
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
              <button 
                onClick={() => {
                  setTemplateToDelete(null);
                  setConfirmName("");
                }}
              >
                Cancel
              </button>
              <button 
                className="delete-btn" 
                onClick={confirmDeletion} 
                disabled={confirmName.trim() !== templateToDelete.name}
              >
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
