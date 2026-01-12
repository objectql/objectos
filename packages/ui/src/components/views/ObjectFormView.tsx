import React from 'react';
// import { ObjectConfig } from '@objectql/types';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';

export interface ObjectFormViewProps {
  objectName: string;
  recordId?: string;
}

export const ObjectFormView: React.FC<ObjectFormViewProps> = ({ objectName, recordId }) => {
  const form = useForm();
  
  return (
    <Form {...form}>
      <form className="space-y-8">
         <div className="p-4 border border-dashed rounded">
           ObjectFormView Placeholder for {objectName}
         </div>
      </form>
    </Form>
  );
};
