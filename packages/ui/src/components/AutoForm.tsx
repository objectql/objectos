import * as React from "react"
import { useForm } from "react-hook-form"
import { Button } from "./Button"
import { Input } from "./Input"
import { Textarea } from "./Textarea"
import { Checkbox } from "./Checkbox"
import { Label } from "./Label"

export interface AutoFormProps {
    schema: any;
    initialValues?: any;
    onSubmit: (data: any) => void;
    onCancel?: () => void;
    readonly?: boolean;
}

export function AutoForm({ schema, initialValues, onSubmit, onCancel, readonly = false }: AutoFormProps) {
    // Merge schema default values with initialValues
    const defaultValues = React.useMemo(() => {
        const defaults: any = {};
        if (schema && schema.fields) {
            Object.entries(schema.fields).forEach(([key, field]: [string, any]) => {
                if (field.defaultValue !== undefined) {
                    defaults[key] = field.defaultValue;
                }
            });
        }
        return { ...defaults, ...initialValues };
    }, [schema, initialValues]);

    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
        defaultValues
    });

    const onFormSubmit = (data: any) => {
        if (readonly) return;
        onSubmit(data);
    };

    if (!schema || !schema.fields) return null;

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
            {Object.entries(schema.fields).map(([key, field]: [string, any]) => {
                if (['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'].includes(key)) return null;
                if (field.hidden) return null;

                const label = field.label || field.description || key;
                const fieldError = errors[key];
                const isReadOnly = readonly || field.readonly;

                if (field.type === 'boolean') {
                    return (
                        <div key={key} className="flex items-center space-x-2 p-1">
                             <Checkbox 
                                id={key}
                                checked={watch(key)}
                                onCheckedChange={(val) => !isReadOnly && setValue(key, val)}
                                disabled={isReadOnly}
                             />
                             <Label htmlFor={key} className="cursor-pointer font-medium text-sm text-gray-700">{label}</Label>
                        </div>
                    );
                }

                if (field.type === 'select' && field.options) {
                    return (
                        <div key={key} className="space-y-1.5">
                            <Label htmlFor={key} className="font-semibold text-gray-500 text-xs uppercase tracking-wide">{label}</Label>
                            <select
                                id={key}
                                {...register(key, { required: field.required })}
                                disabled={isReadOnly}
                                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${fieldError ? "border-red-500" : "border-gray-200"}`}
                            >
                                <option value="">Select an option...</option>
                                {field.options.map((option: string) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            {fieldError && <p className="text-xs text-red-500">This field is required</p>}
                        </div>
                    )
                }

                if (field.type === 'date') {
                    return (
                        <div key={key} className="space-y-1.5">
                            <Label htmlFor={key} className="font-semibold text-gray-500 text-xs uppercase tracking-wide">{label}</Label>
                            <Input 
                                id={key}
                                type="date"
                                {...register(key, { required: field.required })}
                                readOnly={isReadOnly}
                                disabled={false} // Use readOnly for better visibility
                                className={`${fieldError ? "border-red-500" : ""} ${isReadOnly ? "bg-gray-50 text-gray-600" : ""}`}
                            />
                             {fieldError && <p className="text-xs text-red-500">This field is required</p>}
                        </div>
                    );
                }

                if (field.type === 'text' || field.type === 'textarea' || (field.type === 'string' && field.length > 255)) {
                    return (
                        <div key={key} className="space-y-1.5">
                            <Label htmlFor={key} className="font-semibold text-gray-500 text-xs uppercase tracking-wide">{label}</Label>
                            <Textarea 
                                id={key}
                                {...register(key, { required: field.required })}
                                placeholder={field.description}
                                readOnly={isReadOnly}
                                disabled={false}
                                className={`${fieldError ? "border-red-500 min-h-[100px]" : "min-h-[100px]"} ${isReadOnly ? "bg-gray-50 text-gray-600" : ""}`}
                            />
                            {fieldError && <p className="text-xs text-red-500">This field is required</p>}
                        </div>
                    );
                }

                 return (
                    <div key={key} className="space-y-1.5">
                        <Label htmlFor={key} className="font-semibold text-gray-500 text-xs uppercase tracking-wide">{label}</Label>
                        <Input 
                            id={key}
                            type={['integer', 'float', 'currency', 'number'].includes(field.type) ? 'number' : 'text'}
                            step={['float', 'currency'].includes(field.type) ? "0.01" : "1"}
                            {...register(key, { 
                                required: field.required,
                                valueAsNumber: ['integer', 'float', 'currency', 'number'].includes(field.type)
                            })}
                            placeholder={field.description}
                            readOnly={isReadOnly}
                            disabled={false}
                            className={`${fieldError ? "border-red-500" : ""} ${isReadOnly ? "bg-gray-50 text-gray-600" : ""}`}
                        />
                         {fieldError && <p className="text-xs text-red-500">This field is required</p>}
                    </div>
                );
            })}

            {!readonly && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                    {onCancel && <Button variant="secondary" onClick={(e) => { e.preventDefault(); onCancel(); }} className="w-auto">Cancel</Button>}
                    <Button type="submit" className="w-auto">Save Record</Button>
                </div>
            )}
        </form>
    );
}
