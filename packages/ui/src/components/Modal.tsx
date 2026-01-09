import React from 'react';
import ReactDOM from 'react-dom';

export function Modal({ isOpen, onClose, title, children }: any) {
    if (!isOpen) return null;
    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
            {/* Apple-style backdrop with blur */}
            <div 
                className="absolute inset-0 bg-gray-900/30 backdrop-blur-apple transition-opacity" 
                onClick={onClose} 
            />
            {/* Modal container with spring animation */}
            <div className="relative w-full max-w-lg transform border border-gray-200/50 rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh] animate-scaleIn">
                {/* Header with subtle gradient */}
                <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl bg-gradient-to-b from-gray-50/80 to-white">
                    <h3 className="text-lg font-semibold text-gray-900 tracking-tight">{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-apple"
                        aria-label="Close"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                {/* Content area */}
                <div className="px-6 py-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
