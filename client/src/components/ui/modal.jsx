import { useEffect } from "react";
import { Button } from "./button";
import { X } from "lucide-react";

export function Modal({ isOpen, onClose, title, message, type = "info", onConfirm, confirmText = "OK", showCancel = false, cancelText = "Cancel" }) {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          titleColor: 'text-green-800',
          buttonColor: 'bg-green-600 hover:bg-green-700',
          borderColor: 'border-green-200',
          bgColor: 'bg-green-50'
        };
      case 'error':
        return {
          icon: '❌',
          titleColor: 'text-red-800',
          buttonColor: 'bg-red-600 hover:bg-red-700',
          borderColor: 'border-red-200',
          bgColor: 'bg-red-50'
        };
      case 'warning':
        return {
          icon: '⚠️',
          titleColor: 'text-yellow-800',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
          borderColor: 'border-yellow-200',
          bgColor: 'bg-yellow-50'
        };
      case 'confirm':
        return {
          icon: '❓',
          titleColor: 'text-blue-800',
          buttonColor: 'bg-blue-600 hover:bg-blue-700',
          borderColor: 'border-blue-200',
          bgColor: 'bg-blue-50'
        };
      default:
        return {
          icon: 'ℹ️',
          titleColor: 'text-blue-800',
          buttonColor: 'bg-blue-600 hover:bg-blue-700',
          borderColor: 'border-blue-200',
          bgColor: 'bg-blue-50'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred background overlay */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className={`relative w-full max-w-md mx-4 p-6 rounded-lg shadow-xl border ${styles.borderColor} ${styles.bgColor} bg-white`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon and title */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{styles.icon}</span>
          <h3 className={`text-lg font-semibold ${styles.titleColor}`}>
            {title}
          </h3>
        </div>

        {/* Message */}
        <p className="text-gray-700 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Action buttons */}
        <div className="flex gap-3 justify-end">
          {showCancel && (
            <Button
              variant="outline"
              onClick={onClose}
              className="px-4 py-2"
            >
              {cancelText}
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            className={`${styles.buttonColor} text-white px-4 py-2`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
