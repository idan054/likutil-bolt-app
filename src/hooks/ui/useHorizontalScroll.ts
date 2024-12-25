import { useRef } from 'react';

export const useHorizontalScroll = (scrollAmount: number) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (!scrollRef.current) return;
    const newScrollLeft = scrollRef.current.scrollLeft - scrollAmount;
    scrollRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (!scrollRef.current) return;
    const newScrollLeft = scrollRef.current.scrollLeft + scrollAmount;
    scrollRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
  };

  return {
    scrollRef,
    scrollLeft,
    scrollRight
  };
};