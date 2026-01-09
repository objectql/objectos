import React from 'react'
import { FieldProps } from './types'
import { TextField } from './TextField'
import { NumberField } from './NumberField'
import { BooleanField } from './BooleanField'
import { SelectField } from './SelectField'
import { DateField } from './DateField'
import { TextAreaField } from './TextAreaField'
import { LookupField } from './LookupField'

export interface GenericFieldProps extends FieldProps {
    type: string
    referenceTo?: string
}

export function Field({ type, referenceTo, ...props }: GenericFieldProps) {
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
        case 'lookup':
        case 'master_detail':
            if (referenceTo) {
                return <LookupField referenceTo={referenceTo} {...props} />
            }
            return <TextField {...props} />
        default:
            return <TextField {...props} />
    }
}
