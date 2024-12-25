import React from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import rocketAnimation from '../../../assets/animations/rocket.json';

export const LoadingAnimation: React.FC = () => (
  <div className="w-[96px] h-[96px]">
    <Player
      src={rocketAnimation}
      className="w-full h-full scale-[1.7]"
      loop
      autoplay
      background="transparent"
    />
  </div>
);