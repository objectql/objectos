import React, { forwardRef } from 'react';
import { Input, InputProps } from '../Input';
import { FieldWrapper, FieldWrapperProps } from './FieldWrapper';

export interface StringFieldProps extends Omit<InputProps, 'value' | 'onChange'>, Omit<FieldWrapperProps, 'children' | 'className'> {
    value?: string;
    onChange?: (value: string) => void;
    className?: string;
}

export const StringField = forwardRef<HTMLInputElement, StringFieldProps>(
    ({ label, description, error, required, className, value, onChange, ...props }, ref) => {
        const id = props.id || React.useId();
        
        return (
            <FieldWrapper 
                id={id} 
                label={label} 
                description={description} 
                error={error} 
                required={required}
                className={className}
            >
                <Input
                    id={id}
                    ref={ref}
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange?.(e.target.value)}
                    {...props}
                />
            </FieldWrapper>
        );
    }
);
StringField.displayName = "StringField";
