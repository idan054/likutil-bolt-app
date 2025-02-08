import React, { useRef } from 'react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SavedTemplatesCarouselProps {
  templates: string[];
  onSelect: (template: string) => void;
  onDelete: (template: string) => void;  // Add this prop
  isVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;
}

export const SavedTemplatesCarousel: React.FC<SavedTemplatesCarouselProps> = ({
  templates,
  onSelect,
  onDelete,
  isVisible,
  onVisibilityChange,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const scrollAmount = 200;
    const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="relative group bg-gray-50 rounded-lg border p-3"
      >
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-gray-600">תבניות שמורות</h4>
          <button
            onClick={() => onVisibilityChange(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 p-1 rounded-full shadow-md border opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 p-1 rounded-full shadow-md border opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={20} />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-none scroll-smooth"
          >
            {templates.map((template, index) => (
              <div key={index} className="relative shrink-0 max-w-[200px]">

                <button
                  onClick={() => onDelete(template)}
                  className="absolute top-1 left-1 z-10 p-1 rounded-full bg-white border shadow-sm hover:bg-red-50 hover:border-red-200 transition-colors"
                >
                  <X size={10} className="text-gray-500 hover:text-red-500" />
                </button>

                <button
                  onClick={() => onSelect(template)}
                  className="w-full p-2 bg-white border rounded text-right text-sm hover:bg-blue-50 hover:border-blue-200 transition-colors"
                >
                  <p className="line-clamp-3">{template}</p>
                </button>
              </div>
            ))}
          </div>
        </div>
        
      </motion.div>
    </AnimatePresence>
  );
};