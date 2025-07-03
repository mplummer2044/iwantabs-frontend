import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { useWorkout } from '../common/WorkoutContext';

const SwipeContainer = ({ currentIndex = 0, children }) => {
  const { dispatch } = useWorkout();
  return (
    <Swiper
      direction="vertical"
      pagination={{ clickable: true }}
      modules={[Pagination]}
      initialSlide={currentIndex}
      onSlideChange={(swiper) => {
        dispatch({ type: 'SET_EXERCISE_INDEX', payload: swiper.activeIndex });
      }}
      className="swipe-container"
    >
      {React.Children.map(children, (child, idx) => (
        <SwiperSlide key={idx}>{child}</SwiperSlide>
      ))}
    </Swiper>
  );
};

export default SwipeContainer;
