
import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="w-full aspect-[2/3] bg-gray-300 dark:bg-gray-800 rounded-lg overflow-hidden animate-pulse border-2 border-gray-300 dark:border-gray-800">
      <div className="w-full h-full bg-gray-200 dark:bg-gray-900"></div>
    </div>
  );
};

export default React.memo(SkeletonCard);