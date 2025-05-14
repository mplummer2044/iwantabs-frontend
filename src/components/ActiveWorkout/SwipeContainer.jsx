// src/components/ActiveWorkout/SwipeContainer.jsx
import { motion, AnimatePresence } from 'framer-motion';

const SwipeContainer = ({ children, currentIndex }) => {
    if (!Array.isArray(children) || children.length === 0) {
      return <div className="swipe-container">No workouts to display.</div>;
    }
  
    return (
      <div className="swipe-container">
        <AnimatePresence initial={false} custom={currentIndex}>
          <motion.div
            key={currentIndex}
            custom={currentIndex}
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="card-wrapper"
          >
            {children[currentIndex] || <div>No content</div>}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };
  
  export default SwipeContainer;
  
