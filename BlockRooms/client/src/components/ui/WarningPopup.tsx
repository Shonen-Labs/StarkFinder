import React, { useEffect } from 'react';

interface WarningPopupProps {
  isVisible: boolean;
  onClose: () => void;
}

export const WarningPopup: React.FC<WarningPopupProps> = ({
  isVisible,
  onClose
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-close after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 3000,
      backgroundColor: 'rgba(139, 0, 0, 0.95)',
      border: '2px solid #ff6666',
      borderRadius: '8px',
      padding: '20px',
      color: 'white',
      fontFamily: 'monospace',
      minWidth: '300px',
      textAlign: 'center',
      animation: 'pulse 1s infinite'
    }}>
      <div style={{ marginBottom: '10px', color: '#ff6666', fontSize: '24px' }}>
        ⚠️ WARNING ⚠️
      </div>
      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
        BEWARE OF ENEMY!!
      </div>
      <div style={{ fontSize: '12px', color: '#ffcccc', marginTop: '10px' }}>
        This message will close automatically...
      </div>
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};