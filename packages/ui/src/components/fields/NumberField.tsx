import React, { forwardRef } from 'react';
import { Input, InputProps } from '../Input';
import { FieldWrapper, FieldWrapperProps } from './FieldWrapper';

export interface NumberFieldProps extends Omit<InputProps, 'value' | 'onChange'>, Omit<FieldWrapperProps, 'children' | 'className'> {
    value?: number;
    onChange?: (value: number | undefined) => void;
    className?: string;
}

export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
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
                    type="number"
                    value={value === undefined ? '' : value}
                    onChange={(e) => {
                        const val = e.target.value;
                        onChange?.(val === '' ? undefined : Number(val));
                    }}
                    {...props}
                />
            </FieldWrapper>
        );
    }
);
NumberField.displayName = "NumberField";
