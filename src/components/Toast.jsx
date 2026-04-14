import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Toast = ({ message, type = 'error', onClose }) => {
  const [visible, setVisible] = useState(!!message);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            background: type === 'error' ? '#FC8181' : '#48BB78',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            zIndex: 99999,
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>{type === 'error' ? '❌' : '✅'}</span>
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
