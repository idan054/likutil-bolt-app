import React from 'react';
import { motion } from 'framer-motion';

interface SlideInProps {
  children: React.ReactNode;
  direction?: 'left' | 'right';
}

export const SlideIn: React.FC<SlideInProps> = ({ 
  children, 
  direction = 'right' 
}) => (
  <motion.div
    initial={{ opacity: 0, x: direction === 'left' ? -50 : 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: direction === 'left' ? 50 : -50 }}
    transition={{
      type: "spring",
      stiffness: 300,
      damping: 30
    }}
  >
    {children}
  </motion.div>
);