import React, { forwardRef } from 'react';
import { Textarea, TextareaProps } from '../Textarea';
import { FieldWrapper, FieldWrapperProps } from './FieldWrapper';

export interface TextAreaFieldProps extends Omit<TextareaProps, 'value' | 'onChange'>, Omit<FieldWrapperProps, 'children' | 'className'> {
    value?: string;
    onChange?: (value: string) => void;
    className?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
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
                <Textarea
                    id={id}
                    ref={ref}
                    value={value || ''}
                    onChange={(e) => onChange?.(e.target.value)}
                    {...props}
                />
            </FieldWrapper>
        );
    }
);
TextAreaField.displayName = "TextAreaField";
