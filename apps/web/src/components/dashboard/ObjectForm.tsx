import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button, Spinner, Field } from '@objectos/ui';

interface ObjectFormProps {
    objectName: string;
    initialValues: any;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    headers?: Record<string, string>;
}

export function ObjectForm({ objectName, initialValues, onSubmit, onCancel, headers }: ObjectFormProps) {
    const [schema, setSchema] = useState<any>(null);
    const { control, handleSubmit, reset } = useForm({
        defaultValues: initialValues || {}
    });

    useEffect(() => {
         fetch(`/api/v6/metadata/object/${objectName}`, { headers })
            .then(res => res.json())
            .then(res => {
                setSchema(res);
                if (initialValues) {
                    reset(initialValues);
                }
            })
            .catch(console.error);
    }, [objectName, headers, initialValues, reset]);

    if (!schema) return <div className="p-8 flex justify-center"><Spinner className="w-6 h-6" /></div>;

    const fields = Object.entries(schema.fields || {});

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(([key, field]: [string, any]) => {
                if (['id', '_id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'].includes(key)) return null;
                
                const isWide = field.is_wide || ['textarea', 'json', 'markdown', 'code'].includes(field.type);

                return (
                    <Controller
                        key={key}
                        name={key}
                        control={control}
                        rules={{ required: field.required }}
                        render={({ field: { value, onChange }, fieldState: { error } }) => (
                            <Field
                                className={isWide ? "col-span-1 md:col-span-2" : ""}
                                name={key}
                                label={field.label || field.title || key}
                                type={field.type}
                                referenceTo={field.reference_to}
                                value={value}
                                onChange={onChange}
                                error={error?.message}
                                required={field.required}
                                description={field.description}
                                options={field.options}
                            />
                        )}
                    />
                );
            })}
            <div className="flex justify-end gap-2 pt-4 col-span-1 md:col-span-2">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
}
