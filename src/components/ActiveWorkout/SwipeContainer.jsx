import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Mousewheel } from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';
// (Import other Swiper CSS if needed, e.g., navigation or scrollbar, but not required here)

import { useWorkout } from '/Users/Labeaux/iwantabs-frontend/src/components/common/WorkoutContext.js';

const SwipeContainer = ({ children, currentIndex }) => {
  const { dispatch } = useWorkout();

  if (!Array.isArray(children) || children.length === 0) {
    return <div className="swipe-container">No workouts to display.</div>;
  }

  return (
    <Swiper
      direction="vertical"
      slidesPerView={1}
      spaceBetween={0}
      pagination={{ clickable: true }}
      mousewheel={true}
      modules={[Pagination, Mousewheel]}
      initialSlide={currentIndex || 0}
      onSlideChange={(swiper) =>
        dispatch({ type: 'SET_EXERCISE_INDEX', payload: swiper.activeIndex })
      }
      style={{ height: '100vh', width: '100%' }}  
    >
      {children.map((child, index) => (
        <SwiperSlide key={index} style={{ width: '100%', height: '100vh' }}>
          {child}
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default SwipeContainer;
