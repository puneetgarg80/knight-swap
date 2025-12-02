import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, actionLabel, onAction, onClose, duration = 5000 }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
            <div className="bg-gray-800 border border-cyan-500/50 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-4 max-w-sm">
                <div className="flex-1 text-sm">{message}</div>
                {actionLabel && onAction && (
                    <button
                        onClick={onAction}
                        className="text-cyan-400 hover:text-cyan-300 font-bold text-sm whitespace-nowrap"
                    >
                        {actionLabel}
                    </button>
                )}
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 10 5.707 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Toast;
