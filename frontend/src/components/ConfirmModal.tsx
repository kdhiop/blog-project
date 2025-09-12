import { useState, useEffect } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  type = 'danger',
  isLoading = false
}: ConfirmModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
    if (e.key === 'Enter') {
      onConfirm();
    }
  };

  if (!isOpen && !isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return '⚠️';
      case 'warning':
        return '🔔';
      case 'info':
        return 'ℹ️';
      default:
        return '⚠️';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'danger':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      default:
        return '#ef4444';
    }
  };

  return (
    <div 
      className={`confirm-modal-overlay ${isOpen ? 'confirm-modal-overlay--active' : ''}`}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className={`confirm-modal ${isOpen ? 'confirm-modal--active' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
      >
        {/* Header */}
        <div className="confirm-modal-header">
          <div className="confirm-modal-icon" style={{ color: getIconColor() }}>
            {getIcon()}
          </div>
          <h3 id="confirm-modal-title" className="confirm-modal-title">
            {title}
          </h3>
        </div>

        {/* Body */}
        <div className="confirm-modal-body">
          <p id="confirm-modal-message" className="confirm-modal-message">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="confirm-modal-footer">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="confirm-modal-btn confirm-modal-btn--cancel"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`confirm-modal-btn confirm-modal-btn--confirm confirm-modal-btn--${type}`}
          >
            {isLoading ? (
              <>
                <span className="ui-spinner-small"></span>
                처리 중...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for using confirm modal
export function useConfirmModal() {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const showConfirm = ({
    title,
    message,
    confirmText = '확인',
    cancelText = '취소',
    type = 'danger'
  }: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }) => {
    return new Promise<boolean>((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  };

  const ConfirmModalComponent = () => (
    <ConfirmModal
      isOpen={modalState.isOpen}
      title={modalState.title}
      message={modalState.message}
      confirmText={modalState.confirmText}
      cancelText={modalState.cancelText}
      type={modalState.type}
      onConfirm={modalState.onConfirm || (() => {})}
      onCancel={modalState.onCancel || (() => {})}
    />
  );

  return { showConfirm, ConfirmModalComponent };
}