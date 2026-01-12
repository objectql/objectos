import React from 'react';

export interface SingleColumnLayoutProps {
  // TODO: Define props
  components: any[];
}

export const SingleColumnLayout: React.FC<SingleColumnLayoutProps> = ({ components }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="p-4 border border-dashed rounded bg-muted/50">
        Single Column Layout Placeholder
      </div>
    </div>
  );
};
