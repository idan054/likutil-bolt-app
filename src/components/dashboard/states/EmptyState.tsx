import React from 'react';
import { CopyCheck, ListChecks, ListRestart, PackageSearch, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export const EmptyState: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="text-center py-20 px-6 max-w-2xl mx-auto"
  >
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="flex justify-center mb-8"
    >
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-full shadow-lg">
        <ListChecks size={48} className="text-blue-500" />
      </div>
    </motion.div>
    <motion.h3
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-2xl font-bold text-gray-800 mb-4"
    >
      אין הזמנות בטיפול 
    </motion.h3>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="text-gray-600 text-lg mb-10"
    >
      מדהים! נראה שהכל טופל במהירות האור ⚡
    </motion.p>
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => window.location.reload()}
      className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300"
    >
      <ListRestart className="w-5 h-5" />
      טען מחדש
    </motion.button>
  </motion.div>
);