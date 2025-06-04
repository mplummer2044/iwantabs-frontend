// src/components/ActiveWorkout/SwipeContainer.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkout } from '../common/WorkoutContext';
import { useRef } from 'react';

const SwipeContainer = ({ children, currentIndex }) => {
  const { dispatch, state } = useWorkout();
  const touchStartY = useRef(null);
  const touchEndY = useRef(null);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (touchStartY.current !== null && touchEndY.current !== null) {
      const distance = touchStartY.current - touchEndY.current;

      if (distance > 50 && state.currentExerciseIndex < children.length - 1) {
        dispatch({ type: 'SET_EXERCISE_INDEX', payload: state.currentExerciseIndex + 1 });
      } else if (distance < -50 && state.currentExerciseIndex > 0) {
        dispatch({ type: 'SET_EXERCISE_INDEX', payload: state.currentExerciseIndex - 1 });
      }
    }

    touchStartY.current = null;
    touchEndY.current = null;
  };

  if (!Array.isArray(children) || children.length === 0) {
    return <div className="swipe-container">No workouts to display.</div>;
  }

  return (
    <div
      className="swipe-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence initial={false} custom={currentIndex}>
        <motion.div
          key={currentIndex}
          custom={currentIndex}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 25 }}
          className="card-wrapper"
        >
          {children[currentIndex] || <div>No content</div>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SwipeContainer;
