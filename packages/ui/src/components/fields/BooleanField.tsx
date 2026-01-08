import React, { forwardRef } from 'react';
import { Checkbox } from '../Checkbox';
import { Label } from '../Label';
import { cn } from '../../lib/utils';
import { CheckedState } from '@radix-ui/react-checkbox';

export interface BooleanFieldProps {
    value?: boolean;
    onChange?: (value: boolean) => void;
    label?: string;
    description?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    id?: string;
}

export const BooleanField = forwardRef<React.ElementRef<typeof Checkbox>, BooleanFieldProps>(
    ({ label, description, error, required, className, value, onChange, disabled, ...props }, ref) => {
        const id = props.id || React.useId();
        
        return (
            <div className={cn("grid w-full gap-1.5", className)}>
               <div className="flex items-center space-x-2">
                    <Checkbox 
                        id={id}
                        ref={ref}
                        checked={value}
                        onCheckedChange={(checked: CheckedState) => {
                            onChange?.(checked === true);
                        }}
                        disabled={disabled}
                        {...props}
                    />
                    <Label 
                        htmlFor={id} 
                        className={cn(
                            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                            error && "text-red-500"
                        )}
                    >
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
               </div>
                {description && !error && (
                    <p className="text-[0.8rem] text-stone-500 ml-6">
                        {description}
                    </p>
                )}
                {error && (
                    <p className="text-[0.8rem] font-medium text-red-500 ml-6">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);
BooleanField.displayName = "BooleanField";
