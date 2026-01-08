import React from 'react';
import { Label } from '../Label';
import { cn } from '../../lib/utils';

export interface FieldWrapperProps {
    label?: string;
    description?: string;
    error?: string;
    children: React.ReactNode;
    className?: string;
    required?: boolean;
    id?: string;
}

export const FieldWrapper: React.FC<FieldWrapperProps> = ({
    label,
    description,
    error,
    children,
    className,
    required,
    id
}) => {
    return (
        <div className={cn("grid w-full items-center gap-1.5", className)}>
            {label && (
                <Label htmlFor={id} className={cn(error && "text-red-500")}>
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </Label>
            )}
            {children}
            {description && !error && (
                <p className="text-[0.8rem] text-stone-500">
                    {description}
                </p>
            )}
            {error && (
                <p className="text-[0.8rem] font-medium text-red-500">
                    {error}
                </p>
            )}
        </div>
    );
};
