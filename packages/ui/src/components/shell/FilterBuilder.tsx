import React from 'react';
import { Button } from '@/components/ui/button';

export const FilterBuilder = () => {
  return (
    <div className="p-4 border rounded bg-background">
       <div className="flex flex-col gap-2">
         <div>Filter Builder Placeholder</div>
         <Button size="sm" variant="secondary">Add Filter</Button>
       </div>
    </div>
  );
};
