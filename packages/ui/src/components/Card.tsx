import React from 'react';

export function Card({ children, className = "", title, description }: any) {
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200/60 p-6 transition-apple hover:shadow-md ${className}`}>
            {(title || description) && (
                <div className="mb-4">
                    {title && <h3 className="text-lg font-semibold text-gray-900 tracking-tight">{title}</h3>}
                    {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
                </div>
            )}
            {children}
        </div>
    );
}
