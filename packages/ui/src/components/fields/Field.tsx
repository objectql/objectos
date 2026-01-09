import React from 'react'
import { FieldProps } from './types'
import { TextField } from './TextField'
import { NumberField } from './NumberField'
import { BooleanField } from './BooleanField'
import { SelectField } from './SelectField'
import { DateField } from './DateField'
import { TextAreaField } from './TextAreaField'

export interface GenericFieldProps extends FieldProps {
    type: string
}

export function Field({ type, ...props }: GenericFieldProps) {
    switch (type) {
        case 'text':
        case 'string':
        case 'email':
        case 'url':
        case 'password':
        case 'tel':
            return <TextField type={type === 'string' ? 'text' : type as any} {...props} />
        case 'number':
        case 'integer':
        case 'float':
        case 'currency':
        case 'percent':
            return <NumberField {...props} />
        case 'boolean':
            return <BooleanField {...props} />
        case 'date':
        case 'datetime':
            return <DateField {...props} />
        case 'select':
            return <SelectField {...props} />
        case 'textarea':
        case 'longtext':
            return <TextAreaField {...props} />
        default:
            return <TextField {...props} />
    }
}
