import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useBreakpoint } from '../hooks/useBreakpoint';

export const Modal = ({ isOpen, onClose, title, children }) => {
  const { isMobile } = useBreakpoint();

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: 'center',
          padding: isMobile ? 0 : '20px'
        }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)'
            }}
          />
          <motion.div
            initial={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
            animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
            exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: isMobile ? '100%' : '520px',
              maxHeight: isMobile ? '90vh' : '85vh',
              overflowY: 'auto',
              background: 'var(--bg-card)',
              border: isMobile ? 'none' : '1px solid var(--border-color)',
              borderRadius: isMobile ? '20px 20px 0 0' : 'var(--radius-card)',
              padding: isMobile ? '1.25rem' : '2rem',
              paddingBottom: isMobile ? 'calc(6rem + env(safe-area-inset-bottom))' : '2rem',
              borderTop: isMobile ? 'none' : '3px solid transparent',
              borderImage: isMobile ? 'none' : 'var(--gradient-1) 1',
              borderImageSlice: isMobile ? undefined : '1',
              borderTopLeftRadius: isMobile ? '20px' : '0',
              borderTopRightRadius: isMobile ? '20px' : '0',
              boxShadow: isMobile ? '0 -8px 40px rgba(0,0,0,0.5)' : 'var(--glow-purple)'
            }}
          >
            {/* Top accent bar (desktop only) */}
            {!isMobile && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                background: 'var(--gradient-1)', borderRadius: 'var(--radius-card) var(--radius-card) 0 0'
              }} />
            )}

            {/* Drag handle (mobile only) */}
            {isMobile && (
              <div style={{
                width: 40, height: 4,
                background: 'var(--border-color)',
                borderRadius: 2,
                margin: '-4px auto 16px'
              }} />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{title}</h2>
              <button 
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--text-secondary)',
                  cursor: 'pointer', padding: '0.5rem', borderRadius: '50%',
                  width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', minHeight: '44px', minWidth: '44px'
                }}
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
