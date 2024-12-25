import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  isLoading: boolean;
  onClick: () => void;
}

export const Logo: React.FC<LogoProps> = ({ isLoading, onClick }) => (
  <motion.div 
    className="flex items-center cursor-pointer"
    onClick={onClick}
    initial={{ opacity: 0, y: -30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ 
      type: "spring",
      stiffness: 300,
      damping: 20,
      duration: 0.6 
    }}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <motion.img 
      src={isLoading 
        ? "https://www.spider3d.co.il/wp-content/uploads/2024/12/likutil-loader-v2.gif"
        : "https://www.spider3d.co.il/wp-content/uploads/2024/12/image-39.png"
      }
      alt="Likutil Logo"
      className={`${isLoading ? "h-24" : "h-32"} object-contain`} // Increased from h-20/h-24 to h-24/h-32
      animate={{ rotate: isLoading ? 360 : 0 }}
      transition={{ 
        duration: isLoading ? 2 : 0.6,
        repeat: isLoading ? Infinity : 0,
        ease: "linear"
      }}
    />
    
    <motion.img 
      src={"https://www.spider3d.co.il/wp-content/uploads/2024/12/Likutil-Text-Logo.png"}
      alt="Likutil Text Logo"
      className="h-24 object-contain" // Increased from h-20 to h-24
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    />
  </motion.div>
);