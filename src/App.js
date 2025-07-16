import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';

import Header from './components/Header';
import WorkoutTemplateCreator from './components/WorkoutTemplateCreator';
import WorkoutTemplatesList from './components/WorkoutTemplatesList';
import ActiveWorkout from './components/ActiveWorkout';
import WorkoutHistory from './components/WorkoutHistory';

// Base URL for the API Gateway endpoints
const API_BASE = 'https://4tb1rc24q2.execute-api.us-east-1.amazonaws.com/Prod';

function App({ signOut, user }) {
  // State Variables
  const [workoutTemplates, setWorkoutTemplates] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch current authenticated user and then load templates/history
  useEffect(() => {
    const loadUserAndData = async () => {
      try {
        const { tokens } = await fetchAuthSession();
        if (!tokens?.idToken?.payload?.sub) {
          throw new Error("No user ID in token");
        }
        // Store minimal user info (ID and email)
        setCurrentUser({
          username: tokens.idToken.payload.sub,
          email: tokens.idToken.payload.email
        });
        // After setting currentUser, fetch workout data
        fetchWorkouts();
      } catch (err) {
        console.log("User not signed in or session fetch failed", err);
        // If not signed in, Amplify will handle via withAuthenticator
      }
    };
    loadUserAndData();
  }, []);

  // If currentUser changes (e.g., on login), load workouts (redundant with above to keep data fresh)
  useEffect(() => {
    if (currentUser?.username) {
      fetchWorkouts();
    }
  }, [currentUser]);

  // API call: fetch templates and workout history for the user
  const fetchWorkouts = async () => {
    if (!currentUser?.username) return;
    setLoading(true);
    try {
      const { tokens } = await fetchAuthSession();
      const res = await axios.get(`${API_BASE}/templates`, {
        headers: {
          Authorization: tokens?.idToken?.toString()
        }
      });
      // Sort workout history by date (newest first)
      const sortedHistory = (res.data.history || []).sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      const templates = res.data.templates || [];
      // NEW: Attach last workout timestamp to each template
      const templatesWithLastTime = templates.map(template => {
        const lastWorkout = sortedHistory.find(w => w.templateID === template.templateID);
        return { 
          ...template, 
          lastWorkoutTime: lastWorkout 
            ? (lastWorkout.completedAt || lastWorkout.createdAt) 
            : null 
        };
      });
      setWorkoutTemplates(templatesWithLastTime);
      setWorkoutHistory(sortedHistory);
    } catch (err) {
      console.error("Failed to fetch workouts:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ... (other functions like createWorkoutTemplate, deleteWorkoutTemplate, etc., remain unchanged)

  // Finish the active workout: save to database and reset state
  const saveWorkoutProgress = async () => {
    try {
      if (!activeWorkout) {
        alert('No active workout to save');
        return;
      }
      const { tokens } = await fetchAuthSession();
      // Prepare the workout data payload matching the API (DynamoDB) schema
      const workoutData = {
        userID: currentUser.username,
        workoutID: activeWorkout.workoutID,
        templateID: activeWorkout.templateID,
        createdAt: activeWorkout.createdAt,
        completedAt: new Date().toISOString(),
        isTemplate: false,
        exerciseList: activeWorkout.exerciseList.map(ex => ({
          name: ex.name,
          exerciseID: ex.exerciseID,
          measurementType: ex.measurementType,
          sets: ex.sets.map(set => ({
            values: {
              weight: set.values.weight != null ? Number(set.values.weight) : null,
              reps: set.values.reps != null ? Number(set.values.reps) : null,
              distance: set.values.distance != null ? Number(set.values.distance) : null,
              time: set.values.time || null
            },
            status: set.status || 'pending'
          }))
        })),
        ...(activeWorkout.previousWorkouts && { previousWorkouts: activeWorkout.previousWorkouts })
      };
      const response = await axios.post(API_BASE, workoutData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.idToken?.toString()}`
        }
      });
      console.log('Workout saved successfully:', response.data);
      // Refresh the templates and history list after saving
      await fetchWorkouts();
      // Exit the active workout session
      setActiveWorkout(null);
      console.log("Active workout data submitted:", JSON.stringify(activeWorkout, null, 2));
      return response.data;
    } catch (err) {
      console.error("Save failed:", err.response?.data || err.message);
      alert(`Failed to save workout: ${err.response?.data?.message || err.message}`);
      throw err;
    }
  };

  return (
    <div className="app">
      {/* Header with Sign Out */}
      <Header user={user} onSignOut={signOut} />

      {/* Template creation form */}
      <WorkoutTemplateCreator onSave={createWorkoutTemplate} />

      {/* Active workout interface (shown only when a workout is in progress) */}
      {activeWorkout && (
        <ActiveWorkout 
          activeWorkout={activeWorkout} 
          updateActiveWorkout={setActiveWorkout} 
          onFinish={saveWorkoutProgress} 
        />
      )}

      {/* Past workout history list */}
      <WorkoutHistory history={workoutHistory} templates={workoutTemplates} />

      {/* List of workout templates (with Manage/Delete functionality) */}
      <WorkoutTemplatesList 
        templates={workoutTemplates} 
        onStartWorkout={startWorkout}
        onDeleteTemplate={deleteWorkoutTemplate}   
      />
    </div>
  );
}

export default withAuthenticator(App);
