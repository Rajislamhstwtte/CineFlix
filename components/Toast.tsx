import React from 'react';

interface ToastProps {
  message: string | null;
}

const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg shadow-red-600/30 animate-fade-in-up">
      {message}
    </div>
  );
};

export default React.memo(Toast);
